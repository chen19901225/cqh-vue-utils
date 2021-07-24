import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import *as os from "os";


export async function export_var_to_return(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
    /*
    1. 把文件分成__export__之前 __export__到__end_export__之间, __end_export__之后的内容
    2. 判断变量有没有被导出
    3. 重新生成return
    **/
    let current_path = textEditor.document.uri.fsPath;
    let content = fs.readFileSync(current_path, 'utf-8')
    if (textEditor.selection.isEmpty) {
        // 没有选中
        vscode.window.showErrorMessage("请选中要导出的变量");
        return
    }
    let export_var = textEditor.document.getText(textEditor.selections[0])
    export_var = export_var.trim();
    let [first_part, middle_part, end_part] = splitFileContent(content)
    let middle_list = convert_middle_part(middle_part)
    if(middle_list.indexOf(export_var) > -1  ) {
        vscode.window.showErrorMessage(`变量[${export_var}]已经导出`)
        return
    }
    let new_middle_part_list = [
        "// __export__",
        "return {",
    ]
    middle_list.push(export_var)
    for(let var_name of middle_list) {
        new_middle_part_list.push(`${var_name},`)
    }
    new_middle_part_list.push(
        "}",
        "// __end_export__"
    )
    let new_middle_part = new_middle_part_list.join(os.EOL)
    let new_content = first_part + new_middle_part + end_part
    fs.writeFileSync(current_path, new_content, 'utf-8')
    vscode.window.showInformationMessage(`变量[${export_var}]导出成功`);

}

function convert_middle_part(content:string):Array<string> {
    let out = []
    let lines = content.split(os.EOL)
    let escape_lines = ["// __export__", "// __end_export__", "return {", "}"]
    for(let line of lines) {
        line = line.trim()
        if(escape_lines.indexOf(line) > -1) {
            continue
        }
        let parts = line.split(",")
        for(let part of parts) {
            if(part && part.trim()) {
                out.push(part.trim())
            }
        }
    }
    return out
}

function splitFileContent(content: string): [string, string, string] {
    //把文件切分成三个部分
    let lines = content.split(os.EOL);
    let firstLines: Array<string> = [], middleLines: Array<string> = [], endLines: Array<string> = []
    let linesChoices = [firstLines, middleLines, endLines]
    let choiceIndex = 0
    for (let line of lines) {
        line = line.trim()
        if (line === "// __export__") {
            choiceIndex = 1
        }
        linesChoices[choiceIndex].push(line)
        if (line == "// __end_export__") {
            choiceIndex = 2
        }
    }

    return [firstLines.join(os.EOL), middleLines.join(os.EOL), endLines.join(os.EOL)]


    return ["", "", ""]
}


