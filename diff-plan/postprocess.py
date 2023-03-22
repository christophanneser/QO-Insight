# Script to modify output .js file created by emscripten to make it easily importable and useable in React
# Created by @Sheldonfrith, 2022, based on this answer: https://stackoverflow.com/a/60571821/4205839
# by @Kushuh
# WARNING: This script file was thrown together quickly and is thus very fragile
# especially fragile to any changes in emscripten output .js file format, so will probably break with future versions of emscripten

# Called from the command line

import sys

def main():
    # Command line arguments in order
    inFilePath = sys.argv[1] #path to your emscripten-generated .js file
    outFilePath = sys.argv[2] #path to the modified .js file you can use with React
    pathToDotWasmFileRelativeToBuild = sys.argv[3]  # ! Must include "/" at start, example: /wasm/myModule.wasm
    wasmFileName = sys.argv[4] # example: myModule.wasm

    # state variables
    currentlyRemovingEntireFunction = False
    getBinaryPromiseHasBeenRemoved = False
    newGetBinaryPromiseHasBeenAdded = True
    removeNextClosingCurlyBracket = False

    def shouldRemoveEntireFunction(line):
        nonlocal getBinaryPromiseHasBeenRemoved
        if ("function getBinaryPromise" in line and (getBinaryPromiseHasBeenRemoved == False)):
            # remove original getBinaryPromise
            getBinaryPromiseHasBeenRemoved = True
            return True
        if ("function getBinary" in line):
            return True


    # returns either "" or a new line that needs to be written to current line
    def onFinishedRemovingEntireFunction(line):
        # should just continue on
        if (shouldRemoveEntireFunction(line)):
            return ""
        print("finishingFunctionRemoval: " +line +" "+str(getBinaryPromiseHasBeenRemoved) )
        nonlocal currentlyRemovingEntireFunction
        currentlyRemovingEntireFunction = False
        if (getBinaryPromiseHasBeenRemoved):
            nonlocal newGetBinaryPromiseHasBeenAdded
            newGetBinaryPromiseHasBeenAdded = True
            # add the replacement getBinaryPromise function
            return '''const getBinaryPromise = () => new Promise((resolve, reject) => {
            fetch(wasmBinaryFile, { credentials: 'same-origin' })
            .then(
                response => {
                if (!response['ok']) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                }
                return response['arrayBuffer']();
                }
            )
            .then(resolve)
            .catch(reject);
            });
            ''' + line 
        return line


    # return replacement line and handles wrapup of entire function removal
    def removingEntireFunctionHandler(line):
        haveFinishedRemovingFunction = (
            ("function" in line) and (".then" not in line) and ("\"function\"" not in line) and (".catch" not in line))
        if haveFinishedRemovingFunction:
            return onFinishedRemovingEntireFunction(line)
        else:
            return ""


    def shouldRemoveEntireLine(line):
        if ("dataURIPrefix" in line):
            return True
        if ("isDataURI" in line):
            return True


    def shouldSimpleReplaceInLineReturnNewLineIfSo(line):
        if ("= import.meta.url" in line):
            return line.replace("import.meta.url",
                            "\""+pathToDotWasmFileRelativeToBuild+"\"")
                
        if ("self.location.href" in line):
            return line.replace("self.location.href",
                            "window.self.location.href")
        if ("&& !isDataURI(wasmBinaryFile)" in line):
            return line.replace("&& !isDataURI(wasmBinaryFile)","")
        if ("wasmBinaryFile =" in line):
            return "wasmBinaryFile = '" + pathToDotWasmFileRelativeToBuild+"';\n"
        return False

    def shouldRemoveNextClosingCurlyBracket(line):
        if ("return filename.startsWith(dataURIPrefix);" in line):
            return True
        if ("locateFile(wasmBinaryFile)" in line):
            return True
        return False


        

    # MAIN function here
    with open(inFilePath, "rt") as fin:
        with open(outFilePath, "wt") as fout:
            fout.write("/* eslint-disable */\n")
            for line in fin:
                # needs to come first, cause its line is likely going to be deleted
                if shouldRemoveNextClosingCurlyBracket(line):
                    removeNextClosingCurlyBracket = True
                if currentlyRemovingEntireFunction:
                    # let the handler have full control
                    fout.write(removingEntireFunctionHandler(line))
                    continue
                
                if shouldSimpleReplaceInLineReturnNewLineIfSo(line) != False:
                    fout.write(shouldSimpleReplaceInLineReturnNewLineIfSo(line))
                    continue
                
                if shouldRemoveEntireFunction(line):
                    currentlyRemovingEntireFunction = True
                    continue
                if shouldRemoveEntireLine(line):
                    # remove entire line
                    continue
                
                # handle removal of orphan brackets
                
                if (removeNextClosingCurlyBracket and "}" in line):
                    # remove line
                    removeNextClosingCurlyBracket = False
                    continue
                
                else:
                    fout.write(line)
                    
if __name__ == "__main__":
    main()
