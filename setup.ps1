npm init -y
npm install concurrently -D
mkdir backend
cd backend
npm init -y
npm install express cors dotenv jsonwebtoken mongoose socket.io
cd ..
npx -y create-vite@latest frontend --template react
cd frontend
npm install
npm install tailwindcss postcss autoprefixer react-router-dom lucide-react framer-motion recharts socket.io-client axios clsx tailwind-merge
npx -y tailwindcss init -p
cd ..
