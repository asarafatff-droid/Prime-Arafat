import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId, slugify } from '../lib/utils';
import type { Category, Product, Subcategory } from '../types';

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
}

export interface SubcategoryInput {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  sku: string;
  price: number;
  discountPrice?: number;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brand?: string;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  variations?: string[];
  specifications?: Record<string, string>;
  weight?: string;
  shippingInfo?: string;
  status: 'active' | 'draft' | 'archived';
  visible: boolean;
  featured: boolean;
  recommended?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSelling?: boolean;
}

function cleanObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

// =========================================================
// Categories
// =========================================================
export async function listCategories(onlyActive = false): Promise<Category[]> {
  const path = 'categories';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const id = generateId('cat');
  const path = `categories/${id}`;
  const computedSlug = slugify(input.slug || input.name) || id;
  try {
    await setDoc(
      doc(db, 'categories', id),
      cleanObject({
        name: input.name.trim(),
        slug: computedSlug,
        description: input.description?.trim() || '',
        imageUrl: input.imageUrl?.trim() || '',
        displayOrder: Number.isFinite(input.displayOrder) ? Math.max(0, Math.round(input.displayOrder)) : 0,
        active: Boolean(input.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<void> {
  const path = `categories/${id}`;
  try {
    const snap = await getDoc(doc(db, 'categories', id));
    if (!snap.exists()) throw new Error('Category not found.');
    const prev = snap.data();
    await updateDoc(
      doc(db, 'categories', id),
      cleanObject({
        name: input.name !== undefined ? input.name.trim() : prev.name,
        slug: input.slug !== undefined ? slugify(input.slug) || prev.slug : prev.slug,
        description: input.description !== undefined ? input.description.trim() : prev.description || '',
        imageUrl: input.imageUrl !== undefined ? input.imageUrl.trim() : prev.imageUrl || '',
        displayOrder:
          input.displayOrder !== undefined
            ? Math.max(0, Math.round(input.displayOrder))
            : prev.displayOrder,
        active: input.active !== undefined ? Boolean(input.active) : prev.active,
        createdAt: prev.createdAt,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Subcategories
// =========================================================
export async function listSubcategories(onlyActive = false): Promise<Subcategory[]> {
  const path = 'subcategories';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Subcategory, 'id'>) }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createSubcategory(input: SubcategoryInput): Promise<string> {
  const id = generateId('sub');
  const path = `subcategories/${id}`;
  const computedSlug = slugify(input.slug || input.name) || id;
  try {
    await setDoc(
      doc(db, 'subcategories', id),
      cleanObject({
        categoryId: input.categoryId,
        name: input.name.trim(),
        slug: computedSlug,
        description: input.description?.trim() || '',
        displayOrder: Number.isFinite(input.displayOrder) ? Math.max(0, Math.round(input.displayOrder)) : 0,
        active: Boolean(input.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubcategory(id: string, input: Partial<SubcategoryInput>): Promise<void> {
  const path = `subcategories/${id}`;
  try {
    const snap = await getDoc(doc(db, 'subcategories', id));
    if (!snap.exists()) throw new Error('Subcategory not found.');
    const prev = snap.data();
    await updateDoc(
      doc(db, 'subcategories', id),
      cleanObject({
        categoryId: input.categoryId !== undefined ? input.categoryId : prev.categoryId,
        name: input.name !== undefined ? input.name.trim() : prev.name,
        slug: input.slug !== undefined ? slugify(input.slug) || prev.slug : prev.slug,
        description: input.description !== undefined ? input.description.trim() : prev.description || '',
        displayOrder:
          input.displayOrder !== undefined
            ? Math.max(0, Math.round(input.displayOrder))
            : prev.displayOrder,
        active: input.active !== undefined ? Boolean(input.active) : prev.active,
        createdAt: prev.createdAt,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubcategory(id: string): Promise<void> {
  const path = `subcategories/${id}`;
  try {
    await deleteDoc(doc(db, 'subcategories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Products
// =========================================================
export async function listProducts(onlyActiveVisible = false): Promise<Product[]> {
  const path = 'products';
  try {
    const q = onlyActiveVisible
      ? query(
          collection(db, path),
          where('status', '==', 'active'),
          where('visible', '==', true)
        )
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const path = `products/${id}`;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createProduct(input: ProductInput): Promise<string> {
  const id = generateId('prod');
  const path = `products/${id}`;
  const computedSlug = slugify(input.slug || input.name) || id;
  const price = Math.max(0, Number(input.price) || 0);
  const rawDiscount = input.discountPrice !== undefined ? Number(input.discountPrice) : 0;
  const discountPrice = rawDiscount > 0 && rawDiscount <= price ? rawDiscount : 0;

  try {
    await setDoc(
      doc(db, 'products', id),
      cleanObject({
        name: input.name.trim(),
        slug: computedSlug,
        description: input.description?.trim() || '',
        sku: input.sku.trim(),
        price,
        discountPrice,
        categoryId: input.categoryId || '',
        categoryName: input.categoryName || '',
        subcategoryId: input.subcategoryId || '',
        subcategoryName: input.subcategoryName || '',
        brand: input.brand?.trim() || '',
        stock: Math.max(0, Math.round(Number(input.stock) || 0)),
        images: (input.images || []).slice(0, 250),
        sizes: (input.sizes || []).slice(0, 100),
        colors: (input.colors || []).slice(0, 200),
        variations: (input.variations || []).slice(0, 150),
        specifications: input.specifications || {},
        weight: input.weight?.trim() || '',
        shippingInfo: input.shippingInfo?.trim() || '',
        status: input.status,
        visible: Boolean(input.visible),
        featured: Boolean(input.featured),
        recommended: Boolean(input.recommended),
        trending: Boolean(input.trending),
        newArrival: Boolean(input.newArrival),
        bestSelling: Boolean(input.bestSelling),
        salesCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createProductsBulk(
  inputs: ProductInput[]
): Promise<{
  createdIds: string[];
  failed: { index: number; name: string; error: string }[];
}> {
  const createdIds: string[] = [];
  const failed: { index: number; name: string; error: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const item = inputs[i];
    try {
      const id = await createProduct(item);
      createdIds.push(id);
    } catch (err) {
      failed.push({
        index: i,
        name: item.name || `Item #${i + 1}`,
        error: err instanceof Error ? err.message : 'Failed to create product',
      });
    }
  }

  return { createdIds, failed };
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const path = `products/${id}`;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) throw new Error('Product not found.');
    const prev = snap.data() as Omit<Product, 'id'>;
    const price = input.price !== undefined ? Math.max(0, Number(input.price) || 0) : prev.price;
    const rawDiscount =
      input.discountPrice !== undefined ? Number(input.discountPrice) : prev.discountPrice || 0;
    const discountPrice = rawDiscount > 0 && rawDiscount <= price ? rawDiscount : 0;

    await updateDoc(
      doc(db, 'products', id),
      cleanObject({
        name: input.name !== undefined ? input.name.trim() : prev.name,
        slug: input.slug !== undefined ? slugify(input.slug) || prev.slug : prev.slug,
        description: input.description !== undefined ? input.description.trim() : prev.description || '',
        sku: input.sku !== undefined ? input.sku.trim() : prev.sku,
        price,
        discountPrice,
        categoryId: input.categoryId !== undefined ? input.categoryId : prev.categoryId || '',
        categoryName: input.categoryName !== undefined ? input.categoryName : prev.categoryName || '',
        subcategoryId: input.subcategoryId !== undefined ? input.subcategoryId : prev.subcategoryId || '',
        subcategoryName:
          input.subcategoryName !== undefined ? input.subcategoryName : prev.subcategoryName || '',
        brand: input.brand !== undefined ? input.brand.trim() : prev.brand || '',
        stock:
          input.stock !== undefined ? Math.max(0, Math.round(Number(input.stock) || 0)) : prev.stock,
        images: input.images !== undefined ? input.images.slice(0, 250) : prev.images || [],
        sizes: input.sizes !== undefined ? input.sizes.slice(0, 100) : prev.sizes || [],
        colors: input.colors !== undefined ? input.colors.slice(0, 200) : prev.colors || [],
        variations:
          input.variations !== undefined ? input.variations.slice(0, 150) : prev.variations || [],
        specifications:
          input.specifications !== undefined ? input.specifications : prev.specifications || {},
        weight: input.weight !== undefined ? input.weight.trim() : prev.weight || '',
        shippingInfo:
          input.shippingInfo !== undefined ? input.shippingInfo.trim() : prev.shippingInfo || '',
        status: input.status !== undefined ? input.status : prev.status,
        visible: input.visible !== undefined ? Boolean(input.visible) : prev.visible,
        featured: input.featured !== undefined ? Boolean(input.featured) : prev.featured,
        recommended:
          input.recommended !== undefined ? Boolean(input.recommended) : Boolean(prev.recommended),
        trending: input.trending !== undefined ? Boolean(input.trending) : Boolean(prev.trending),
        newArrival:
          input.newArrival !== undefined ? Boolean(input.newArrival) : Boolean(prev.newArrival),
        bestSelling:
          input.bestSelling !== undefined ? Boolean(input.bestSelling) : Boolean(prev.bestSelling),
        salesCount: prev.salesCount ?? 0,
        ratingAvg: prev.ratingAvg ?? 0,
        ratingCount: prev.ratingCount ?? 0,
        createdAt: prev.createdAt,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
