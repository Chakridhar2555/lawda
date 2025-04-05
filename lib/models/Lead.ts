import mongoose from "mongoose"

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  leadStatus: {
    type: String,
    enum: ["cold", "warm", "hot", "mild"],
    default: "cold",
  },
  leadResponse: {
    type: String,
    enum: ["active", "inactive", "not answering", "not actively answering", "always responding"],
    default: "inactive",
  },
  leadSource: {
    type: String,
    enum: ["google ads", "meta", "refferal", "linkedin", "youtube"],
    default: "google ads",
  },
  leadType: {
    type: String,
    enum: ["Pre construction", "resale", "seller", "buyer"],
    default: "buyer",
  },
  clientType: {
    type: String,
    enum: ["Investor", "custom buyer", "first home buyer", "seasonal investor", "commercial buyer"],
    default: "custom buyer",
  },
  property: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: "",
  },
  callHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      duration: Number,
      recording: String,
    },
  ],
  tasks: [
    {
      id: String,
      title: String,
      date: String,
      description: String,
      status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending"
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
      }
    }
  ],
  propertyPreferences: {
    budget: {
      min: Number,
      max: Number
    },
    propertyType: [String],
    bedrooms: Number,
    bathrooms: Number,
    locations: [String],
    features: [String]
  }
})

export const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema)

