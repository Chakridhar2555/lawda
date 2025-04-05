import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId, WithId } from "mongodb"

interface Lead {
  _id: string | ObjectId
  name: string
  email: string
  phone: string
  property: string
  assignedTo?: ObjectId
  [key: string]: any
}

// Sample lead data
const SAMPLE_LEADS = [
  {
    _id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+917981847657",
    status: "Sell",
    property: "123 Maple Avenue",
    date: "2024-01-25T08:30:00Z",
    notes: "Interested in selling their 3-bedroom house",
    callHistory: [
      {
        date: "2024-01-26T10:00:00Z",
        duration: 180,
        recording: "mock_recording_1.mp3",
      },
    ],
    strategy: {
      lastUpdated: "2024-01-28T10:00:00Z",
      tasks: [
        {
          id: "1",
          date: "2024-01-29T09:00:00Z",
          task: "Follow up on property viewing",
        },
        {
          id: "2",
          date: "2024-02-01T14:00:00Z",
          task: "Discuss financing options",
        },
      ],
      notes:
        "Client is very interested in the property on Maple Street. Need to provide more information on local schools.",
    },
  },
  {
    _id: "2",
    name: "Michael Chen",
    email: "mchen@example.com",
    phone: "+917981847657",
    status: "Rent",
    property: "456 Oak Street",
    date: "2024-01-26T09:15:00Z",
    notes: "Looking for a 2-bedroom apartment",
    callHistory: [],
  },
  {
    _id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    phone: "+917981847657",
    status: "Lease",
    property: "789 Pine Road",
    date: "2024-01-26T14:20:00Z",
    notes: "Interested in commercial property lease",
    callHistory: [
      {
        date: "2024-01-27T11:30:00Z",
        duration: 240,
        recording: "mock_recording_2.mp3",
      },
    ],
  },
  {
    _id: "4",
    name: "David Thompson",
    email: "david.t@example.com",
    phone: "+917981847657",
    status: "Sell",
    property: "321 Birch Lane",
    date: "2024-01-27T10:45:00Z",
    notes: "Selling luxury property",
    callHistory: [],
  },
  {
    _id: "5",
    name: "Lisa Martinez",
    email: "lisa.m@example.com",
    phone: "+917981847657",
    status: "Rent",
    property: "654 Cedar Court",
    date: "2024-01-27T16:00:00Z",
    notes: "Seeking pet-friendly rental",
    callHistory: [
      {
        date: "2024-01-28T09:15:00Z",
        duration: 300,
        recording: "mock_recording_3.mp3",
      },
    ],
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');

    let query = {};
    if (assignedTo) {
      query = { assignedTo };
    }

    const { db } = await connectToDatabase();
    const leads = await db.collection("leads").find(query).toArray();
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const updates = await request.json()

    const result = await db.collection<Lead>("leads").findOneAndUpdate(
      { _id: new ObjectId(updates._id) },
      { $set: updates },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, lead: result })
  } catch (error) {
    console.error("Update lead error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const leadData = await request.json()
    const { db } = await connectToDatabase()

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.phone || !leadData.property) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Convert assignedTo to ObjectId if present
    if (leadData.assignedTo) {
      try {
        leadData.assignedTo = new ObjectId(leadData.assignedTo)
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid assignedTo ID" },
          { status: 400 }
        )
      }
    }

    // Create the lead
    const result = await db.collection("leads").insertOne(leadData)

    if (!result.insertedId) {
      throw new Error("Failed to create lead")
    }

    // Return created lead
    return NextResponse.json({
      success: true,
      lead: {
        ...leadData,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    )
  }
}

