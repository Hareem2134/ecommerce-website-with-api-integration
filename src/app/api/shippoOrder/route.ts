// src/app/api/shippoOrder/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Interface for the raw rate object directly from Shippo API
interface RawShippoRateFromAPI {
  object_id: string; // This is what Shippo provides
  amount: string;    // Shippo sends amount as a string
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  estimated_days?: number;
  // ... any other fields you might get directly from Shippo's rate object
}

// Interface for the overall Shippo shipment response
interface RawShippoShipmentResponse {
  object_id: string;
  rates: RawShippoRateFromAPI[]; // Array of raw Shippo rate objects
  messages?: any[];
}

// THIS IS THE STRUCTURE THE FRONTEND (CheckoutPage.tsx) EXPECTS
// for each item in the 'rates' array it receives.
interface MappedRateForFrontend {
  id: string; // Mapped from object_id
  provider?: string;
  servicelevel_name?: string;
  description: string;
  amount: number; // Mapped from string amount, converted to number
  currency?: string;
  estimated_days?: number;
}

export async function POST(req: NextRequest) {
  const shippoApiKey = process.env.SHIPPO_API_KEY;

  if (!shippoApiKey) {
    console.error("API Route: Shippo API Key is missing.");
    return NextResponse.json({ error: "Internal server configuration error." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { addressFrom, addressTo, parcels } = body;

    if (!addressFrom || !addressTo || !parcels) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const payloadToShippo = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels,
      async: false,
    };

    // Call Shippo API - response.data will be RawShippoShipmentResponse
    const shippoAPIResponse = await axios.post<RawShippoShipmentResponse>(
      "https://api.goshippo.com/shipments/",
      payloadToShippo,
      {
        headers: {
          Authorization: `ShippoToken ${shippoApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API Route: Raw response from Shippo:", JSON.stringify(shippoAPIResponse.data, null, 2));

    if (!shippoAPIResponse.data || !Array.isArray(shippoAPIResponse.data.rates)) {
        console.error("API Route: Invalid or missing rates array from Shippo API.");
        return NextResponse.json({ error: "Failed to get rates from shipping provider." }, { status: 502 }); // Bad Gateway
    }

    // --- THIS IS THE CRUCIAL MAPPING STEP ---
    const transformedRatesForFrontend: MappedRateForFrontend[] = shippoAPIResponse.data.rates.map(rawRate => {
      // Basic validation for rawRate from Shippo
      if (!rawRate.object_id || typeof rawRate.amount !== 'string' || !rawRate.provider || !rawRate.servicelevel?.name) {
        console.warn("API Route: Skipping malformed rate from Shippo:", rawRate);
        return null; // This will be filtered out later
      }
      return {
        id: rawRate.object_id, // Map object_id to id
        provider: rawRate.provider,
        servicelevel_name: rawRate.servicelevel.name,
        description: `${rawRate.provider} ${rawRate.servicelevel.name}`,
        amount: parseFloat(rawRate.amount), // Convert string amount to number
        currency: rawRate.currency,
        estimated_days: rawRate.estimated_days,
      };
    }).filter(rate => rate !== null) as MappedRateForFrontend[]; // Filter out any nulls from malformed rates

    console.log("API Route: Transformed rates being sent to frontend:", JSON.stringify({ rates: transformedRatesForFrontend }, null, 2));

    return NextResponse.json({ rates: transformedRatesForFrontend }, { status: 200 });

  } catch (error: any) {
    console.error("API Route: Error in /api/shippoOrder POST:", error.response?.data || error.message || error);
    return NextResponse.json(
      { error: "Failed to process shipping request.", details: error.response?.data?.details || error.message },
      { status: error.response?.status || 500 }
    );
  }
}