import { type SchemaTypeDefinition } from 'sanity'
import products from './products'
import category from './category'
import order from './order'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [products, category, order],
}
