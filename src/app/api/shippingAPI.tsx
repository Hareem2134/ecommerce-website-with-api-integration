import { NextApiRequest, NextApiResponse } from "next";

const mockShippingRates = [
  { id: "rate_1", description: "Standard Shipping (3-5 days)", rate: 5.99 },
  { id: "rate_2", description: "Express Shipping (1-2 days)", rate: 15.99 },
  { id: "rate_3", description: "Overnight Shipping (next day)", rate: 25.99 },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Please use POST." });
  }

  const { items, address } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart items are required and must be an array." });
  }

  if (!address || !address.name || !address.city || !address.state || !address.zip) {
    return res.status(400).json({
      error: "Address must include name, city, state, and zip.",
    });
  }

  try {
    res.status(200).json({ rates: mockShippingRates });
  } catch (error) {
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
}
