import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId, WithId, Filter } from "mongodb"

interface Lead {
  _id: string | ObjectId
  name: string
  notesHistory?: Array<{
    id: string
    timestamp: string
    content: string
    leadName: string
  }>
  showings?: Array<{
    id: string
    createdAt: string
    [key: string]: any
  }>
  [key: string]: any
}

export async function GET(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    console.log('Searching for lead with ID:', params.leadId)

    let lead: WithId<Lead> | null = null
    let query: Filter<Lead> = { $or: [{ _id: params.leadId }] }

    try {
      const objectId = new ObjectId(params.leadId)
      query.$or?.push({ _id: objectId })
    } catch (error) {
      console.log('Invalid ObjectId format:', error)
    }

    lead = await db.collection<Lead>("leads").findOne(query)

    if (!lead) {
      console.log('No lead found with ID:', params.leadId)
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    console.log('Found lead:', lead)
    return NextResponse.json(lead)
  } catch (error) {
    console.error("Fetch lead error:", error)
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const updates = await request.json()
    
    console.log('Attempting to update lead:', params.leadId)
    
    // First find the lead by ID
    let query: Filter<Lead> = { $or: [{ _id: params.leadId }] }
    try {
      const objectId = new ObjectId(params.leadId)
      query.$or?.push({ _id: objectId })
    } catch (error) {
      console.log('Invalid ObjectId format:', error)
    }

    const lead = await db.collection<Lead>("leads").findOne(query)

    if (!lead) {
      console.error('No lead found with ID:', params.leadId)
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Remove _id from updates to prevent immutable field error
    const { _id, ...updateData } = updates

    // Handle notes updates
    if (updateData.notes) {
      const existingNotes = Array.isArray(lead.notesHistory) ? lead.notesHistory : []
      const newNoteEntry = {
        id: new ObjectId().toString(),
        timestamp: new Date().toISOString(),
        content: updateData.notes,
        leadName: lead.name
      }
      updateData.notesHistory = [...existingNotes, newNoteEntry]
    }

    // Handle showing updates
    if (updateData.showings) {
      const existingShowings = Array.isArray(lead.showings) ? lead.showings : []
      if (Array.isArray(updateData.showings)) {
        // If updating entire showings array
        updateData.showings = updateData.showings.map((showing: { id?: string; createdAt?: string; [key: string]: any }) => ({
          ...showing,
          id: showing.id || new ObjectId().toString(),
          createdAt: showing.createdAt || new Date().toISOString()
        }))
      } else {
        // If adding a single showing
        const newShowing = {
          id: new ObjectId().toString(),
          createdAt: new Date().toISOString(),
          ...updateData.showings
        }
        updateData.showings = [...existingShowings, newShowing]
      }
    }

    // Update using the name as a reference
    const result = await db.collection<Lead>("leads").findOneAndUpdate(
      { name: lead.name },
      { $set: updateData },
      { 
        returnDocument: "after"
      }
    )

    if (!result) {
      console.error('Failed to update lead with name:', lead.name)
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      )
    }

    console.log('Successfully updated lead:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Update lead error:", error)
    return NextResponse.json(
      { error: "Failed to update lead", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 