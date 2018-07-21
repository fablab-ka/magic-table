cd src
python main.py &
cd content-engine
node index.js

#kill background job on term
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT