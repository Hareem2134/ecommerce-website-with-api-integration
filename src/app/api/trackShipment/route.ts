// src/app/api/trackShipment/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Interface for the expected structure from Shippo's GET /tracks/{carrier}/{tracking_number}/ endpoint
interface ShippoTrackingStatusResponse {
  tracking_status: {
    status: string; // e.g., PRE_TRANSIT, IN_TRANSIT, DELIVERED, FAILURE, UNKNOWN
    status_details: string;
    status_date: string; // ISO Date string
    location?: {
      city: string | null;
      state: string | null;
      zip: string | null;
      country: string | null;
    };
  } | null;
  tracking_history: Array<{
    status: string;
    status_details: string;
    status_date: string; // ISO Date string
    location?: {
        city?: string | null; // Made optional as per usage
        state?: string | null; // Made optional as per usage
        // Add other location fields if Shippo provides them
    };
  }>;
  eta: string | null; // Estimated time of arrival (ISO Date string)
  // Other fields Shippo might return:
  // carrier: string;
  // tracking_number: string;
  // address_to: { ... };
  // messages: any[];
}

// Interface for the data structure the Frontend (CheckoutPage.tsx) expects
interface FrontendTrackingDetails {
  status: string;
  history: Array<{
    date: string;
    location: string;
    status: string;
  }>;
  eta: string; // Formatted ETA string
}


export async function POST(req: NextRequest) {
  const shippoApiKey = process.env.SHIPPO_API_KEY;
  const shippoMode = process.env.NEXT_PUBLIC_SHIPPO_MODE || "test"; // Default to test

  if (!shippoApiKey) {
    console.error("API /trackShipment: Shippo API Key is missing.");
    return NextResponse.json(
      { error: "Internal server error: API configuration missing." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    // Destructure 'carrier' from body and rename it to 'receivedCarrier' for clarity
    const { trackingNumber, carrier: receivedCarrierFromFrontend } = body;

    if (!trackingNumber) {
      console.warn("API /trackShipment: Tracking number not provided in request.");
      return NextResponse.json({ error: "Tracking number is required." }, { status: 400 });
    }


    // FOR SHIPPO TEST MODE TRACKING NUMBERS (even those from specific carriers like USPS test transactions),
    // Shippo's API expects 'shippo' as the carrier for the /tracks endpoint.
    // const effectiveCarrierForShippoTestTracking = "shippo";
    
    // Determine the carrier token to use for the Shippo API call.
    // If the frontend sends a specific carrier (e.g., "usps"), use that.
    // Otherwise, if `receivedCarrier` is undefined or empty (which it shouldn't be if /api/placeOrder is correct),
    // AND if you are dealing with Shippo's generic test tracking numbers, you would use "shippo".
    // However, for carrier-specific test tracking numbers (like USPS ones from test transactions),
    // you MUST use the specific carrier token (e.g., "usps").

    // let effectiveCarrier: string;

    // if (receivedCarrier && typeof receivedCarrier === 'string' && receivedCarrier.trim() !== '') {
    //   effectiveCarrier = receivedCarrier.trim().toLowerCase(); // Use provided carrier, ensure lowercase
    // } else {
    //   // This case should ideally not be hit if your /api/placeOrder correctly returns the carrier.
    //   // If it is hit, it means the frontend didn't get a specific carrier.
    //   // Using "shippo" here is a fallback for Shippo's *generic* test numbers,
    //   // but it will fail for carrier-specific test numbers, as you've seen.
    //   console.warn(`API /trackShipment: Carrier not provided or invalid ('${receivedCarrier}'). This will likely fail for carrier-specific test tracking numbers. A specific carrier token (e.g., 'usps') is needed.`);
    //   // Returning an error because trying with 'shippo' for a specific carrier's test number will fail as per Shippo's error message.
    //   return NextResponse.json({ error: "Carrier information is missing or invalid. Cannot track shipment." }, { status: 400 });
    // }

    
    let carrierForShippoAPI: string;

    if (shippoMode === "test") {
      carrierForShippoAPI = "shippo"; // For test mode, Shippo wants "shippo" for all lookups via /tracks
      console.log(`API /trackShipment: Shippo mode is TEST. Using carrier "shippo" for tracking.`);
    } else { // Live mode
      if (!receivedCarrierFromFrontend) {
        console.error("API /trackShipment: Live mode, but no specific carrier token provided by frontend.");
        return NextResponse.json({ error: "Carrier information is required for live tracking." }, { status: 400 });
      }
      carrierForShippoAPI = receivedCarrierFromFrontend.trim().toLowerCase();
    }

    console.log(`API /trackShipment: Tracking TKN: "${trackingNumber}" with carrier for API call: "${carrierForShippoAPI}"`);

    const shippoTrackingAPIUrl = `https://api.goshippo.com/tracks/${carrierForShippoAPI}/${trackingNumber}/`

    console.log(`API /trackShipment: Calling Shippo URL: ${shippoTrackingAPIUrl}`);

    const shippoResponse = await axios.get<ShippoTrackingStatusResponse>(
      shippoTrackingAPIUrl,
      {
        headers: {
          Authorization: `ShippoToken ${shippoApiKey}`,
        //   "Content-Type": "application/json", // Though for GET, Content-Type isn't strictly needed for the request itself
        },
      }
    );

    const trackingData = shippoResponse.data;
    console.log("API /trackShipment: Data received from Shippo GET /tracks endpoint:", JSON.stringify(trackingData, null, 2));

    // Map to the frontend's expected `TrackingDetails` structure
    const formattedEta = trackingData.eta ? new Date(trackingData.eta).toLocaleDateString() : "Not available";
    const currentStatus = trackingData.tracking_status?.status_details || trackingData.tracking_status?.status || "PENDING";

    const history = (trackingData.tracking_history || []).map(h => {
        const locationObject = h.location as { city?: string; state?: string } | undefined; // Type assertion for safety
        const city = locationObject?.city || '';
        const state = locationObject?.state || '';
        let locationString = 'N/A';
        if (city && state) {
            locationString = `${city}, ${state}`;
        } else if (city) {
            locationString = city;
        } else if (state) {
            locationString = state;
        }

        return {
            date: h.status_date ? new Date(h.status_date).toLocaleString() : "Date N/A",
            location: locationString.trim(),
            status: h.status_details || h.status || "Status N/A",
        };
    });

    const frontendDetails: FrontendTrackingDetails = {
        status: currentStatus.replace(/_/g, ' ').toUpperCase(),
        history: history,
        eta: formattedEta
    };

    return NextResponse.json(frontendDetails, { status: 200 });

  } catch (error: any) {
    if (error.isAxiosError && error.response) {
      console.error("API /trackShipment: Axios Error from Shippo:", {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
      });
      // Pass Shippo's detailed error back to the frontend
      return NextResponse.json(
        { error: "Failed to fetch tracking details from provider.", details: error.response.data },
        { status: error.response.status }
      );
    }
    console.error("API /trackShipment: Non-Axios or Unexpected Error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to track shipment due to an unexpected error." },
      { status: 500 }
    );
  }
}