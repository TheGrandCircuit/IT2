var baseURL = {
    api: 'https://api.github.com/repos/TheGrandCircuit/IT2/',
    raw: 'https://raw.githubusercontent.com/TheGrandCircuit/IT2/master/',
    page: 'https://thegrandcircuit.github.io/IT2/',
    parameters: {
        token: 'access_token=8301ab86754739755fce14e5a8598761ece47714'
    }
}
var Descriptions = {}
var Tree = {}
async function getSha() {
    return new Promise(resolve => {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', baseURL.api + 'branches?' + baseURL.parameters.token, true)
        xhr.onload = function () {
            if (this.status == 200) {
                resolve(
                    JSON.parse(this.response)[0].commit.sha
                )
            } else {
                alert(this.response)
            }
        }
        xhr.send()
    })
}

/**@description Gets the raw treedata */
async function getRawTree() {
    var tree = await getSha()
    return new Promise(resolve => {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', baseURL.api + 'git/trees/' + tree + '?recursive=1&' + baseURL.parameters.token, true)
        xhr.onload = function () {
            if (this.status == 200) {
                resolve(JSON.parse(this.response))
            } else {
                alert(this.response)
            }
        }
        xhr.send()
    })
}

/**@description Parses the raw tree */
async function parseTree(rawTree) {
    return new Promise(async resolve => {
        var tree = { content: {}, sha: rawTree.sha, url: rawTree.url, path: 'Root', type: 'tree' }
        for (let i = 0; i < rawTree.tree.length; i++) {
            const element = rawTree.tree[i];
            /**@type {Array} */
            var path = element.path.split('/')
            if (path[path.length - 1] == 'DESCRIPTION.TXT') {
                loadDesc(await getTextFile(element.path))
                continue
            }
            var target = tree
            for (let j = 0; j < path.length - 1; j++) {
                target = target.content[path[j]]
            }
            element.content = {}
            target.content[path[path.length - 1]] = element
        }
        var tree2 = { content: {}, sha: rawTree.sha, url: rawTree.url, path: 'tree2' }
        tree = { content: { tree: tree }, type: 'tree' }
        resolve(tree)
    })
}

/**@description loads the tree to the DOM */
async function loadTree() {
    var tree = await parseTree(await getRawTree())
    return new Promise(resolve => {
        var div = document.getElementById('tree')
        /**@param item
         * @param {HTMLElement} parent */
        function loadContent(item, parent, indent) {
            var files = []
            for (const key in item.content) {
                const element = item.content[key];
                /**@description main element (contains name and content) */
                var DOMElement = document.createElement('div')
                DOMElement.classList.add('item')
                DOMElement.id = element.path

                /**@description button to expand a folder */
                var Button = document.createElement('div')
                Button.classList.add('treeButton')
                Button.classList.add('closed')
                DOMElement.appendChild(Button)
                //sets the file icon
                Button.innerHTML = '&#9634'
                //if element is a folder
                //set the icon to an arrow and add functionality
                if (element.type == 'tree') {
                    Button.innerHTML = '&#9654'
                    Button.addEventListener('click', e => {
                        //open the folder
                        if (e.target.classList.contains('closed')) {
                            e.path[1].classList.remove('closed')
                            e.target.classList.remove('closed')
                            e.target.classList.add('open')

                            e.target.innerHTML = '&#9660'

                            //close the folder
                        } else if (e.target.classList.contains('open')) {
                            e.target.classList.remove('open')
                            e.path[1].classList.add('closed')
                            e.target.classList.add('closed')

                            e.target.innerHTML = '&#9654'
                        }
                    })
                }

                /**@description contains the name of the file/folder */
                var name = document.createElement('div')
                name.innerHTML = element.path.split('/').pop()
                name.dataset.path = element.path
                name.classList.add('name')
                name.addEventListener('click', e => {
                    viewDesc(e.target.dataset.path)
                })
                //add a link
                name.addEventListener('dblclick', e => {
                    window.open(baseURL.page + e.target.dataset.path)
                })

                DOMElement.appendChild(name)

                //if folder load the contents
                if (element.type == 'tree') {
                    DOMElement.classList.add('tree')
                    DOMElement.classList.add('closed')
                    parent.appendChild(DOMElement)
                    loadContent(element, DOMElement, indent + 1)
                }
                else {
                    files.push(DOMElement)
                }
            }
            //add files to the end of the list
            for (let i = 0; i < files.length; i++) {
                parent.appendChild(files[i])
            }
        }
        loadContent(tree, div, 1)
        resolve()
    })

}
/**@description gets the text content of a file given a path */
async function getTextFile(path) {
    return new Promise(resolve => {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', baseURL.raw + path, true)
        xhr.onload = function () {
            if (this.status == 200) {
                resolve(this.response)
            } else {
                alert(this.response)
            }
        }
        xhr.send()
    })
}

/**@description parses and collects descriptions in one place */
async function loadDesc(text) {
    var descriptions = text.split('#')
    for (let i = 1; i < descriptions.length; i += 2) {
        Descriptions[descriptions[i].split(';')[0]] = descriptions[i + 1].replace('\n', '').trim();

    }
}

/**@description puts description in an element(ID="desc") given a path */
function viewDesc(path) {
    var box = document.getElementById('desc')
    box.innerHTML = Descriptions[path] || 'This item has no description.'
}

/**@param {XMLHttpRequest} xhr  */
function buildAuthHeader(xhr){
    xhr.setRequestHeader('Authorization', 'token '+localStorage.authToken)
}


loadTree()