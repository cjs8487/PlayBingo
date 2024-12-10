#!/bin/bash
set -e

tsx prisma/ready.ts

npx prisma migrate dev

tsx prisma/seed.ts

npm run dev