import { toPublicProduct } from "../mappers.js";
import { getProductItem, queryProducts } from "../services/dynamo.js";
import { AppError } from "../errors.js";
import { json } from "../utils/response.js";

export async function listProducts(event) {
  const query = event.queryStringParameters || {};
  const category = query.category?.trim() || "";
  const q = query.q?.trim().toLowerCase() || "";
  let products = await queryProducts({ category: category || undefined });
  if (q) {
    products = products.filter((product) => {
      const haystack = `${product.name} ${product.summary} ${product.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  products.sort((a, b) => a.name.localeCompare(b.name));
  return json(200, { products: products.map(toPublicProduct) });
}

export async function getProduct(event) {
  const product = await getProductItem(event.pathParameters.id);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "That product is not in the catalog.");
  }
  return json(200, { product: toPublicProduct(product) });
}
