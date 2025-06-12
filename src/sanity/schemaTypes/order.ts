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
            fields: [
              { name: "productId", title: "Product ID", type: "string" },
              { name: "quantity", title: "Quantity", type: "number" },
              { name: "price", title: "Price", type: "number" },
            ],
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
          list: ["Pending", "Shipped", "Delivered"],
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
        initialValue: () => new Date().toISOString(),
      },
    ],
  };
  