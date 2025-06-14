export default {
    name: "order",
    title: "Order",
    type: "document",
    fields: [
      {
        name: "userId",
        title: "User ID",
        type: "string",
      },
      {
        name: "items",
        title: "Items",
        type: "array",
        of: [
          {
            type: "object",
            title: "Order Item", // Optional: gives a nicer title when adding new items in Studio
            fields: [
              { name: "productId", title: "Product ID", type: "string" },
              { name: "name", title: "Product Name", type: "string" },
              { name: "quantity", title: "Quantity", type: "number" },
              { name: "price", title: "Price", type: "number" },
            ],
            preview: {
              select: {
                title: 'name', // Use the 'name' field for the item title
                subtitle: 'productId',
                quantity: 'quantity',
                price: 'price'
              },
              prepare(selection: { title: any; subtitle: any; quantity: any; price: any; }) {
                const { title, subtitle, quantity, price } = selection;
                return {
                  title: `${title || 'Untitled Item'} (ID: ${subtitle || 'N/A'})`,
                  subtitle: `Qty: ${quantity || 0} @ ${price !== undefined ? Number(price).toFixed(2) : '0.00'} each`,
                };
              }
            }
          },
        ],
      },
      {
        name: "totalAmount",
        title: "Total Amount",
        type: "number",
      },
      {
        name: "status",
        title: "Status",
        type: "string",
        options: {
          list: ["Pending", "Shipped", "Delivered", "Processing"],
        },
        initialValue: "Pending",
      },
      {
        name: "trackingNumber",
        title: "Tracking Number",
        type: "string",
      },
      {
        name: "shippingAddress",
        title: "Shipping Address",
        type: "object",
        fields: [
          { name: "street", title: "Street", type: "string" },
          { name: "city", title: "City", type: "string" },
          { name: "state", title: "State", type: "string" },
          { name: "zipCode", title: "Zip Code", type: "string" },
          { name: "country", title: "Country", type: "string" },
        ],
      },
      {
        name: "createdAt",
        title: "Created At",
        type: "datetime",
        createdAt: new Date().toISOString(),
      },
    // --- FIELDS LIKELY MISSING FROM YOUR SCHEMA ---
    // Add these if you want to store them:
    { name: "clientOrderId", title: "Client Order ID", type: "string" },
    { name: "customerName", title: "Customer Name", type: "string" },
    { name: "customerEmail", title: "Customer Email", type: "string" },
    { name: "stripePaymentIntentId", title: "Stripe Payment Intent ID", type: "string" },
    { name: "shippoTransactionId", title: "Shippo Transaction ID", type: "string" },
    { name: "shippoLabelUrl", title: "Shippo Label URL", type: "url" }, // 'url' type might be better
    { name: "shippingCost", title: "Shipping Cost", type: "number" },
    { name: "shippingMethod", title: "Shipping Method", type: "string" },
  ],
};