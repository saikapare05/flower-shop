import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middlewares/auth.js';

// Configure Cloudinary from environment secrets
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const router = Router();

// Sanitise values that go into Cloudinary context strings (| and = are delimiters)
function sanitizeCtxValue(val: string): string {
  return String(val).replace(/[|=]/g, ' ').trim();
}

function buildContextString(data: {
  title?: string;
  description?: string;
  category?: string;
  order?: number | string;
  featured?: boolean | string;
}): string {
  const parts: string[] = [];
  if (data.title      !== undefined) parts.push(`title=${sanitizeCtxValue(String(data.title))}`);
  if (data.description !== undefined) parts.push(`description=${sanitizeCtxValue(String(data.description))}`);
  if (data.category   !== undefined) parts.push(`category=${sanitizeCtxValue(String(data.category))}`);
  if (data.order      !== undefined) parts.push(`order=${data.order}`);
  if (data.featured   !== undefined) parts.push(`featured=${data.featured}`);
  return parts.join('|');
}

function parseResource(r: any) {
  const ctx = r.context?.custom ?? {};
  return {
    id: r.public_id,
    publicId: r.public_id,
    url: r.secure_url,
    title: ctx.title || r.display_name || r.public_id.split('/').pop() || '',
    description: ctx.description || '',
    category: ctx.category || (r.tags?.[0] ?? 'uncategorized'),
    featured: ctx.featured === 'true',
    order: parseInt(ctx.order ?? '9999', 10),
    createdAt: r.created_at,
  };
}

// ── GET /api/gallery — public, no auth ────────────────────────────────────────
router.get('/gallery', async (_req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    res.status(500).json({ error: 'CLOUDINARY_CLOUD_NAME not configured on server.' });
    return;
  }
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'gallery/',
      max_results: 500,
      context: true,
      tags: true,
    });

    const images = (result.resources as any[])
      .map(parseResource)
      .sort((a, b) => a.order - b.order);

    console.info(`[gallery] Listed ${images.length} images`);
    res.json(images);
  } catch (err: any) {
    console.error('[gallery] GET error:', err.message, err.http_code);
    res.status(500).json({ error: err.message ?? 'Failed to list gallery images.' });
  }
});

// ── POST /api/gallery/metadata — save/update context on an existing image ─────
// Body: { publicId, title, description, category, order, featured }
router.post('/gallery/metadata', requireAuth, async (req, res) => {
  const { publicId, title, description, category, order, featured } = req.body;

  if (!publicId) {
    res.status(400).json({ error: 'publicId is required.' });
    return;
  }

  try {
    const contextStr = buildContextString({ title, description, category, order, featured });
    const tags = category ? [category] : undefined;
    await cloudinary.api.update(publicId, {
      context: contextStr,
      ...(tags ? { tags } : {}),
    });
    console.info(`[gallery] Metadata saved for ${publicId}`);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[gallery] metadata update error:', err.message, err.http_code);
    res.status(500).json({ error: err.message ?? 'Failed to update metadata.' });
  }
});

// ── POST /api/gallery/delete — delete an image from Cloudinary ────────────────
// Body: { publicId }
router.post('/gallery/delete', requireAuth, async (req, res) => {
  const { publicId } = req.body as { publicId?: string };

  if (!publicId) {
    res.status(400).json({ error: 'publicId is required.' });
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.info(`[gallery] Deleted ${publicId}:`, result.result);
    if (result.result === 'not found') {
      res.status(404).json({ error: 'Image not found in Cloudinary.' });
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[gallery] delete error:', err.message, err.http_code);
    res.status(500).json({ error: err.message ?? 'Failed to delete image.' });
  }
});

// ── POST /api/gallery/reorder — batch-update order values ────────────────────
// Body: [{ publicId, order }]
router.post('/gallery/reorder', requireAuth, async (req, res) => {
  const items: Array<{ publicId: string; order: number }> = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Expect a non-empty array of { publicId, order }.' });
    return;
  }

  try {
    await Promise.all(
      items.map(({ publicId, order }) =>
        cloudinary.api.update(publicId, { context: `order=${order}` })
      )
    );
    console.info(`[gallery] Reordered ${items.length} images`);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[gallery] reorder error:', err.message);
    res.status(500).json({ error: err.message ?? 'Failed to reorder.' });
  }
});

export default router;
