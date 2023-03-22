FILE=./node_modules/react-scripts/config/webpack.config.js
if test -f "$FILE"; then
    echo "$FILE exists. Override it!"
else
    echo "$FILE DOES NOT EXISTS! Install node_modules first."
    exit 1
fi

cp modified-webpack.config.js $FILE
exit 0
