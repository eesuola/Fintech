// src/swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fintech API",
      version: "1.0.0",
      description:
        "API documentation for Fintech app with Flutterwave integration",
    },
    servers: [{ url: "http://localhost:7070/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // your route files
};

const specs = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
  console.log("Swagger docs available at /api/docs");
};
