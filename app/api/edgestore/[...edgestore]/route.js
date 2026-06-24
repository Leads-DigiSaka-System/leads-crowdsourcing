import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

/**
 * This is the main router for the EdgeStore buckets.
 */
const edgeStoreRouter = es.router({
    publicFiles: es.fileBucket().beforeDelete(() => {

        return true; // allow delete
    }),
    companyLogos: es.imageBucket({
        maxSize: 1024 * 1024, // 1MB
    })
    .beforeUpload(({ ctx, input, fileInfo }) => {
        // Only accept images
        if (!fileInfo.type.startsWith('image/')) {
            throw new Error('Only image files are allowed');
        }
        return true;
    })
    .beforeDelete(() => {
        return true; // allow delete
    }),

});

const handler = createEdgeStoreNextHandler({
    router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

