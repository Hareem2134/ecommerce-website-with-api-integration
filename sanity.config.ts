'use client'

import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

// Environment variables fallback for Sanity configuration
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'fallback_project_id';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-01-01'; // Use a valid default API version

export default defineConfig({
  basePath: '/Studio',
  projectId, // Use environment variable or fallback
  dataset, // Use environment variable or fallback

  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({ structure }),

    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }), // Use environment variable or fallback
  ],
});
