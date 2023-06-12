/*
  This file aims to globalize the importing and exporting of files in different editor apps. 
  
  Standard features:
  - a "importedData" variable that's named the same thing for all apps containing unparsed project data
  - a "parseImportedData"   function that's named the same thing for all apps but performs different actions for each app
  - a project file input that has the same ID for all apps which also specifies how the file should be read: <input id="dataFileInput" readertype="arraybuffer" accept=".mcstructure">
  - an export button 
  - a file downloading button
  
  This way, uploads and downloads can smoothly change if files are instead being synced with bridge. or another editor.
  
  To reference this file in an app the order should go like this:
  1. App's personal script
  2. FileSaver API
  3. This file
  4. Website's global script.js
*/

/**
 * @typedef ReaderType
 * @type { "text" | "arraybuffer" | "dataurl" | "binarystring" | "arraybuffer/text" }
*/

/**
 * @param { File } file
 * @param { string } projectVariable
 * @param { ReaderType } readertype
 * @param { (file: File) => void } callback
*/
function importFile(file, projectVariable, readertype, callback){
  
  var reader = new FileReader();
  reader.onload = function(e){
    // @ts-expect-error - The type checker didn't like indexing onto the global scope with an arbitrary unknown key
    window[projectVariable] = e.target.result;
    callback(file);
  }
  
  switch(readertype){
    case 'arraybuffer': 
      reader.readAsArrayBuffer(file);
      break;
    case 'dataurl': 
      reader.readAsDataURL(file);
      break;
    case 'binarystring': 
      reader.readAsBinaryString(file);
      break;
    case 'arraybuffer/text':
      //Unique to Structure Editor, this will read as text if a JSON file is imported, but read as ArrayBuffer if any other type is imported.
      if(window.location.pathname === "/structure-editor/old/"){
        //Show loading button in Legacy Structure Editor
        /** @type { HTMLLabelElement } */ (document.getElementById("loading2")).style.display = "block";
        /** @type { HTMLLabelElement } */ (document.getElementById("upload2")).style.display = "none";
      }
      console.log(file);
      if(file.name.endsWith(".json")){
        reader.readAsText(file);
        console.log('text');
      } else {
        reader.readAsArrayBuffer(file);
        console.log('ab');
      }
      break;
    case "text":
    default:
      reader.readAsText(file);
  }
}

//If app does not support filesaver, add it
if(!window.saveAs){
  var sa = document.createElement("script");
  sa.src = "/filesaver.js";
  document.head.appendChild(sa);
}

/**
 * @param { Blob } file
 * @param { string } name
 * @param { string } custombridgepath
*/
function exportFile(file, name, custombridgepath){
  //The user is attempting to save the file. 
  if(window.iapi && window.bridge.openedFile && window.bridge.connected){
    //Bridge. is connected. Intercept the file and send it to bridge. instead of downloading it to your computer
    file.arrayBuffer().then(buff => {
      let filearray = new Uint8Array(buff);
      let bridgepath = custombridgepath || window.bridge.openedFile
      iapi.trigger('fs.writeFile', { filePath: bridgepath, data: filearray }).then(function(){
        snackbar('File has been saved to bridge.');
      })
    });
  } else {
    //Downloads the file using the FileSaver API.
    saveAs(file, name);
  }
}

//Check if app supports datahandler file importing
if(document.getElementById("dataFileInput")){
  const projectInputElement = /** @type { HTMLInputElement } */ (document.getElementById("dataFileInput"));
  
  //Set the filereader type to "text" by default
  /** @type { ReaderType } */
  var readertype = "text";
  //Change the filereader type if the <input> element contains a "readertype" attribute
  if(projectInputElement.hasAttribute("readertype")){
    readertype = /** @type { ReaderType } */ (projectInputElement.getAttribute("readertype"));
  }
  
  //Add the event listener to the input element
  projectInputElement.addEventListener("change", function(){
    importFile(/** @type { FileList } */ (this.files)[0], 'importedData', readertype, parseImportedData);
  });
}

function changeExportButton(){
  if(document.querySelector(".export-button")){
    for(let ebutton of document.querySelectorAll(".export-button")){
      ebutton.innerHTML = "Save to Bridge.";
    }
  }
  
  //Structure Editor
  if(document.querySelector(".export-type")){
    /** @type { HTMLSelectElement } */ (document.querySelector(".export-type")).style.display = "none";
  }
}

if(window.parent != window){
  //Connect to bridge.
  var bridgescript = document.createElement("script");
  bridgescript.type = "module";
  bridgescript.src = "/js/bridge-connect.js";
  bridgescript.defer = true;
  bridgescript.id = "-bridge-connect";
  document.head.appendChild(bridgescript);
}