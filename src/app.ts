import {createServer, IncomingMessage, ServerResponse} from 'node:http';
import {join} from 'path';
import {readdir, stat} from 'fs/promises';
import {createReadStream} from 'fs';

type Content = {name: string, path: string, preview: string}

const imageFormats = ['png', 'jpeg', 'svg', 'jpg', ]
const fileIcon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 15V15.8C17 16.9201 17 17.4802 16.782 17.908C16.5903 18.2843 16.2843 18.5903 15.908 18.782C15.4802 19 14.9201 19 13.8 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V12.2C3 11.0799 3 10.5198 3.21799 10.092C3.40973 9.71569 3.71569 9.40973 4.09202 9.21799C4.51984 9 5.0799 9 6.2 9H7M16 5H10.2C9.0799 5 8.51984 5 8.09202 5.21799C7.71569 5.40973 7.40973 5.71569 7.21799 6.09202C7 6.51984 7 7.0799 7 8.2V11.8C7 12.9201 7 13.4802 7.21799 13.908C7.40973 14.2843 7.71569 14.5903 8.09202 14.782C8.51984 15 9.0799 15 10.2 15H17.8C18.9201 15 19.4802 15 19.908 14.782C20.2843 14.5903 20.5903 14.2843 20.782 13.908C21 13.4802 21 12.9201 21 11.8V10M16 5L21 10M16 5V8.4C16 8.96005 16 9.24008 16.109 9.45399C16.2049 9.64215 16.3578 9.79513 16.546 9.89101C16.7599 10 17.0399 10 17.6 10H21" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const folderIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H5L8 3H13V5H3.7457L2.03141 11H4.11144L5.2543 7H16L14 14H0V1Z" fill="#fff"/></svg>'

const server = createServer((req, res) => {
    const url = req.url;
    console.log(url);
    if(url == '/favicon.ico') {
        res.end(fileIcon);
        return;
    }else if(url.startsWith('/getFile')) {
        sendFile(url, res);
        // res.end(folderIcon)
        return;
    }

    const paths = url.split('/').filter(e => e != '');
    const pathString = getPathString(paths);
    let folders: Content[] = [], files: Content[] = [], images: Content[] = [];
    console.log(pathString)
    readdir(pathString, {withFileTypes: true}).then(contents => {
        contents.forEach(e => {
            const fileName = e.name;
            if(e.isDirectory()) {
                folders.push(createContent(fileName, folderIcon));
            } else {
                let isImage = false;
                imageFormats.forEach(e => isImage = isImage || fileName.endsWith(e));
                if(isImage) {
                    images.push(createContent(fileName, '/' + paths.concat([fileName]).join('/')));
                } else {
                    files.push(createContent(fileName, fileIcon));
                }
            }

        })

        res.end(makeHtml(folders, files, images, paths));
    }).catch(e => {
        console.log('From reading directory')
        console.log(pathString);
        console.log(e);
    })

    function createContent(fileName: string, preview: string): Content {
        const path = paths.concat([fileName]).join('/');
        return {name: fileName, preview, path}
    }
});

function sendFile(url: string, res: ServerResponse<IncomingMessage>) {
    const paths = url.replace('/getFile/', '').split('/').filter(e => e != '');
    const pathString = getPathString(paths);
    
    stat(pathString).then(value => {
        res.writeHead(200, {
            'content-length': value.size
        });
        // console.log('Pathstring is ' + pathString);
        createReadStream(pathString).pipe(res);
        // res.end(fileIcon);
    }).catch(e => {
        console.log('From reading file stat')
        console.log(pathString);
        console.log(e);
    })
    
}
 
function makeHtml(folders: Content[], files: Content[], images: Content[], currentLocationList: string[]): string {
    const folderList = createListElement(folders, 'folderLink');
    const fileList = createListElement(files, 'fileLink');
    const imageList = images.map(e => {
        return '<li><a class="imageLink" href="' + e.path + '"><img class="imagePreview" src="' +  e.preview + '"><span class="contentName">' +  e.name + '</span></a></li>'
    }).join('');
    const title = currentLocationList[currentLocationList.length - 1]? currentLocationList[currentLocationList.length - 1]: '/';

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>` + title + `</title>
    <style>
        body {background-color: black; color: lightcyan; font-size: 1.2em;}
        #folder {background-color: darkslategrey; color: white;}
        li{display:inline-flex;margin-right:1%;margin-bottom:1%;padding:.15%;width:8em;height:2.5em;justify-content:start;align-items:center}
        li:hover{background-color: firebrick}
        .back {color: orangered;cursor:pointer}
        li>a>svg,li>a>img {height:1em;margin-right:.5em}
        li>a{color:white;text-decoration:none;display:flex}
    </style>
    <script>function a(b){return Array.from(document.getElementsByClassName(b))};function c(b,d){b[d]=b[d].replace(window.location.origin,window.location.origin+'/getFile')};
    document.addEventListener("DOMContentLoaded",()=>{a('imagePreview').forEach(b=>c(b,'src'));a('fileLink').concat(a('imageLink')).forEach(b=>c(b,'href'))})</script>
</head>
<body>
    <h2>` + currentLocationList.join('/') + ` | <a onclick="goBack()" class="back">< back</a></h2>

    <ul id="folder">` + folderList + `</ul>
    <ul id="files">` + fileList + `</ul>
    <ul id="images">` + imageList + `</ul>
</body>
<script>function goBack(){const e=document.URL;window.open(e.substring(0, e.lastIndexOf('/')),'_blank')}</script>
</html>`
}

function createListElement(content: Content[], cssClass: string): string {
    return content.map(e => {
        return '<li><a class="' + cssClass + '" href="' + e.path + '">' +  e.preview + '<span class="contentName">' +  e.name + '</span></a></li>'
    }).join('');
}

function getPathString(paths: string[]): string {
    let pathString = join();
    paths.forEach(e => pathString = join(pathString, e));
    return pathString;
}
server.listen(3000);