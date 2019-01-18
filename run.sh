cd cv-server
python3 main.py &

#kill background job on term
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

cd ../content-engine
npx webpack --watch &
node index.js

#kill background job on term
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
