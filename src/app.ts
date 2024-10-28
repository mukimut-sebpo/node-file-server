import {createServer} from 'node:http';
import {join} from 'path';
import {readdir} from 'fs/promises';

type Content = {name: string, path: string, preview: string}
const fileIcon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 15V15.8C17 16.9201 17 17.4802 16.782 17.908C16.5903 18.2843 16.2843 18.5903 15.908 18.782C15.4802 19 14.9201 19 13.8 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V12.2C3 11.0799 3 10.5198 3.21799 10.092C3.40973 9.71569 3.71569 9.40973 4.09202 9.21799C4.51984 9 5.0799 9 6.2 9H7M16 5H10.2C9.0799 5 8.51984 5 8.09202 5.21799C7.71569 5.40973 7.40973 5.71569 7.21799 6.09202C7 6.51984 7 7.0799 7 8.2V11.8C7 12.9201 7 13.4802 7.21799 13.908C7.40973 14.2843 7.71569 14.5903 8.09202 14.782C8.51984 15 9.0799 15 10.2 15H17.8C18.9201 15 19.4802 15 19.908 14.782C20.2843 14.5903 20.5903 14.2843 20.782 13.908C21 13.4802 21 12.9201 21 11.8V10M16 5L21 10M16 5V8.4C16 8.96005 16 9.24008 16.109 9.45399C16.2049 9.64215 16.3578 9.79513 16.546 9.89101C16.7599 10 17.0399 10 17.6 10H21" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const folderIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H5L8 3H13V5H3.7457L2.03141 11H4.11144L5.2543 7H16L14 14H0V1Z" fill="#fff"/></svg>'

const server = createServer((req, res) => {
    const url = req.url;

    if(url == '/favicon.ico') {
        res.end(fileIcon);
        return;
    }

    const paths = url.split('/').filter(e => e != '');
    let pathString = join();
    paths.forEach(e => pathString = join(pathString, e));
    let folders: Content[] = [], files: Content[] = [], images: Content[] = [];
    
    readdir(pathString, {withFileTypes: true}).then(contents => {
        contents.forEach(e => {
            if(e.isDirectory()) {
                const path = paths.concat([e.name]).join('/');
                const currentContent: Content = {name: e.name, preview: folderIcon, path}
                folders.push(currentContent);
            } else {
                const path = paths.concat([e.name]).join('/');
                const currentContent: Content = {name: e.name, preview: fileIcon, path}
                files.push(currentContent);
            }

        });

        res.end(sendHtml(folders, files, [], paths));
    })
});

function sendHtml(folders: Content[], files: Content[], images: Content[], currentLocationList: string[]): string {
    const folderList = createListElement(folders);
    const fileList = createListElement(files);
    const imageList = createListElement(images);

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>` + currentLocationList[currentLocationList.length - 1] + `</title>
    <style>
        body {background-color: black; color: lightcyan; font-size: 1.2em;}
        #folder {background-color: darkslategrey; color: white;}
        ul {line-height: 1.5;}
        li {display: inline; margin-right: 1%; padding: .15%;}
        li:hover{background-color: firebrick}
        .back {color: orangered;cursor:pointer}
        li > a > svg {height: 1em; margin-right: .2em}
        li > a {color: white; text-decoration: none}
    </style>
</head>
<body>
    <h2>` + currentLocationList.join('/') + ` | <a onclick="goBack()" class="back">< back</a></h2>

    <ul id="folder">` + folderList + `</ul>
    <ul id="files">` + fileList + `</ul>

    <ul id="images">` + images + `</ul>
</body>
<script>function goBack(){const a=document.URL;window.open(a.substring(0, a.lastIndexOf('/')),'_blank')}</script>
</html>`
}

function createListElement(content: Content[]): string {
    return content.map(e => {
        return '<li><a href="' + e.path + '">' +  e.preview + '<span class="contentName">' +  e.name + '</span></a></li>'
    }).join('');
}
server.listen(3000);