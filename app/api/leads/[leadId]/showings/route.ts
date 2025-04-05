import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get showings for a specific lead
export async function GET(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    
    const lead = await db.collection("leads").findOne(
      { _id: new ObjectId(params.leadId) },
      { projection: { showings: 1, name: 1 } }
    )

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Return empty array if no showings
    if (!lead.showings) {
      return NextResponse.json([])
    }

    // Add lead information to each showing
    const showingsWithLeadInfo = lead.showings.map((showing: any) => ({
      ...showing,
      leadName: lead.name,
      leadId: params.leadId
    }))

    return NextResponse.json(showingsWithLeadInfo)
  } catch (error) {
    console.error("Fetch showings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch showings" },
      { status: 500 }
    )
  }
}

// Update showings for a specific lead
export async function PUT(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { showings } = await request.json()
    
    const lead = await db.collection("leads").findOne(
      { _id: new ObjectId(params.leadId) },
      { projection: { name: 1 } }
    )

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Update the lead with the new showings
    const result = await db.collection("leads").updateOne(
      { _id: new ObjectId(params.leadId) },
      { $set: { showings } }
    )

    // Sync with the events collection
    try {
      // For each showing, ensure it exists in the events collection
      for (const showing of showings) {
        // Create an event-compatible object
        const eventData = {
          title: `${showing.property || 'Property Showing'} - ${lead.name}`,
          date: new Date(showing.date),
          time: showing.time || '12:00',
          type: 'viewing',
          description: showing.notes || `Showing for ${lead.name}`,
          location: showing.property || '',
          status: showing.status || 'scheduled',
          leadId: params.leadId,
          leadName: lead.name,
          showingId: showing.id,
          lastSynced: new Date()
        }

        // Update or create the event
        await db.collection("events").updateOne(
          { showingId: showing.id },
          { $set: eventData },
          { upsert: true }
        )
      }
    } catch (error) {
      console.error("Error syncing showings with events:", error)
      // Continue with the response even if syncing fails
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update showings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, showings })
  } catch (error) {
    console.error("Update showings error:", error)
    return NextResponse.json(
      { error: "Failed to update showings" },
      { status: 500 }
    )
  }
}

// Add a new showing for a specific lead
export async function POST(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const showing = await request.json()
    
    const lead = await db.collection("leads").findOne(
      { _id: new ObjectId(params.leadId) },
      { projection: { showings: 1, name: 1 } }
    )

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Ensure showing has an id and other required fields
    const newShowing = {
      ...showing,
      id: showing.id || new Date().toISOString(),
      status: showing.status || 'scheduled',
      date: new Date(showing.date)
    }

    // Get current showings or initialize empty array
    const currentShowings = lead.showings || []
    
    // Add the new showing
    const updatedShowings = [...currentShowings, newShowing]
    
    // Update the lead
    const result = await db.collection("leads").updateOne(
      { _id: new ObjectId(params.leadId) },
      { $set: { showings: updatedShowings } }
    )

    // Sync with events collection
    try {
      // Create an event-compatible object
      const eventData = {
        title: `${newShowing.property || 'Property Showing'} - ${lead.name}`,
        date: new Date(newShowing.date),
        time: newShowing.time || '12:00',
        type: 'viewing',
        description: newShowing.notes || `Showing for ${lead.name}`,
        location: newShowing.property || '',
        status: newShowing.status || 'scheduled',
        leadId: params.leadId,
        leadName: lead.name,
        showingId: newShowing.id,
        lastSynced: new Date()
      }

      // Create the event
      await db.collection("events").insertOne(eventData)
    } catch (error) {
      console.error("Error syncing showing with events:", error)
      // Continue with the response even if syncing fails
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to add showing" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      showing: {
        ...newShowing,
        leadName: lead.name,
        leadId: params.leadId
      } 
    })
  } catch (error) {
    console.error("Add showing error:", error)
    return NextResponse.json(
      { error: "Failed to add showing" },
      { status: 500 }
    )
  }
} 