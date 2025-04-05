import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch all leads that have showings
    const leads = await db.collection("leads").find(
      { showings: { $exists: true } }
    ).project({
      name: 1,
      showings: 1
    }).toArray()

    // Transform the data to include lead information with each showing
    const allShowings = leads.flatMap(lead => 
      lead.showings.map((showing: any) => ({
        ...showing,
        leadName: lead.name,
        leadId: lead._id.toString(),
        // Add fields for calendar compatibility
        id: showing.id || new Date().toISOString(),
        title: `${showing.property || 'Property Showing'} - ${lead.name}`,
        type: showing.type || 'viewing',
        date: showing.date,
        description: showing.notes || `Showing for ${lead.name}`,
        location: showing.property || '',
        time: showing.time || '12:00'
      }))
    )

    // Also sync with events collection for dashboard/calendar
    try {
      // For each showing, ensure it exists in the events collection
      for (const showing of allShowings) {
        await db.collection("events").updateOne(
          { showingId: showing.id }, // Use the showing ID to identify the event
          { 
            $set: {
              title: showing.title,
              date: new Date(showing.date),
              time: showing.time,
              type: 'viewing',
              description: showing.description,
              location: showing.location,
              status: showing.status || 'scheduled',
              leadId: showing.leadId,
              leadName: showing.leadName,
              showingId: showing.id,
              lastSynced: new Date()
            } 
          },
          { upsert: true } // Create if doesn't exist
        )
      }
    } catch (error) {
      console.error("Error syncing showings with events:", error)
      // Continue with the response even if syncing fails
    }

    return NextResponse.json(allShowings)
  } catch (error) {
    console.error("Fetch showings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch showings" },
      { status: 500 }
    )
  }
} 