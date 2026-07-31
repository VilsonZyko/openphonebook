# Use Node.js LTS Alpine for a lightweight base image
FROM node:22-alpine

# Install Python and C++ build tools required to natively compile better-sqlite3
RUN apk add --no-cache python3 make g++ 

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only
# The native build tools will be used by better-sqlite3's postinstall script
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables for production and data path
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/phonebook.db

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
