#!/bin/bash

npx prisma migrate dev

tsx prisma/seed.ts

npm run dev