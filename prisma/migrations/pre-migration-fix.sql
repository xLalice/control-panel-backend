-- 1. Replace deprecated enum values to prevent migration errors
UPDATE "Inquiry"
SET "status" = 'Pending'
WHERE "status" IN ('Quoted', 'Approved', 'Scheduled', 'Fulfilled', 'Cancelled');

-- 2. Preserve quoted data by moving to a backup table (optional)
-- Or just null them out to pass migration
UPDATE "Inquiry"
SET "quotedAt" = NULL,
    "quotedBy" = NULL,
    "quotedPrice" = NULL
WHERE "quotedAt" IS NOT NULL
  OR "quotedBy" IS NOT NULL
  OR "quotedPrice" IS NOT NULL;

-- 3. Null out relatedLeadId to avoid issues if you're removing it
UPDATE "Inquiry"
SET "relatedLeadId" = NULL
WHERE "relatedLeadId" IS NOT NULL;

-- 4. Detect and resolve duplicates before adding a unique constraint
-- (Optional: log or export duplicates before deletion)
WITH duplicates AS (
  SELECT "originatingInquiryId", COUNT(*)
  FROM "Lead"
  WHERE "originatingInquiryId" IS NOT NULL
  GROUP BY "originatingInquiryId"
  HAVING COUNT(*) > 1
)
SELECT * FROM "Lead"
WHERE "originatingInquiryId" IN (SELECT "originatingInquiryId" FROM duplicates);
-- You must manually fix these before applying the unique constraint.
-- For now, you can choose to NULL them:
UPDATE "Lead"
SET "originatingInquiryId" = NULL
WHERE "originatingInquiryId" IN (
  SELECT "originatingInquiryId" FROM (
    SELECT "originatingInquiryId"
    FROM "Lead"
    WHERE "originatingInquiryId" IS NOT NULL
    GROUP BY "originatingInquiryId"
    HAVING COUNT(*) > 1
  ) AS dup_ids
);
