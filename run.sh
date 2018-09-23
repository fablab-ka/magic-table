cd cv-server
python main.py &

cd ../content-engine
npx webpack --watch &
node index.js

#kill background job on term
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT