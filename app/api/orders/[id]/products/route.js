import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createOrderProduct, 
  updateOrderProduct, 
  deleteOrderProduct,
  getOrderProducts 
} from '@/lib/orderProducts';
import { recalculateProfit } from '@/lib/finance';
import { recordOrderEvent } from '@/lib/orderEvents';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const products = await getOrderProducts(parseInt(params.id));
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const productData = await request.json();
    await createOrderProduct(parseInt(params.id), productData);
    
    await recalculateProfit(parseInt(params.id), { syncSellingPrice: true });
    await recordOrderEvent({
      orderId: parseInt(params.id),
      eventType: 'product_added',
      actorId: parseInt(userId),
      summary: 'تم إضافة منتج',
      metadata: { product_name: productData.product_name }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { productId, ...productData } = await request.json();
    await updateOrderProduct(productId, productData);
    
    await recalculateProfit(parseInt(params.id), { syncSellingPrice: true });
    await recordOrderEvent({
      orderId: parseInt(params.id),
      eventType: 'product_updated',
      actorId: parseInt(userId),
      summary: 'تم تعديل منتج',
      metadata: { product_id: productId, product_name: productData.product_name }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }
    
    await deleteOrderProduct(parseInt(productId));
    
    await recalculateProfit(parseInt(params.id), { syncSellingPrice: true });
    await recordOrderEvent({
      orderId: parseInt(params.id),
      eventType: 'product_deleted',
      actorId: parseInt(userId),
      summary: 'تم حذف منتج',
      metadata: { product_id: parseInt(productId) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

