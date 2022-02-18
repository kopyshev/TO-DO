"use strict";

const app = document.querySelector("#app");
const emptyBoard = document.querySelector(".newBoard");
const COLORS = {
  sheengreen: "hsla(80,100%,42%,0.8)",
  blueberry: "hsla(220,91%,64%,0.8)",
  mustard: "hsla(47,100%,67%,0.8)",
  salmon: "hsla(6,93%,71%,0.8)",
  frenchskyblue: "hsla(212,99%,73%,0.8)",
  mediumaquamarine: "hsla(154,64%,63%,0.8)",
  crayolamacaroni: "hsla(28,100%,74%,0.8)",
  bluemagenta: "hsla(274,100%,84%,0.8)",
};

const colorNames = Object.keys(COLORS);
let currentColor = 0;

emptyBoard.addEventListener("dblclick", createNewBoard);

let boardTemplate;
getTemplate();

function getTemplate() {
  let request = new XMLHttpRequest();
  request.onload = function () {
    if (request.status != 200) {
      let sad = document.createElement("div");
      sad.style.margin = "100px";
      sad.innerHTML = `<img src ="sad.png" width="100px" style="margin:30px auto;display: block;"><p>I'm so sorry... try again later</p>`;
      emptyBoard.before(sad);
      emptyBoard.classList.add("hidden");
      return;
    }
    boardTemplate = request.responseXML;
    loadJSON();
  };
  request.open("GET", "./rss/board.html");
  request.responseType = "document";
  request.send();
}

function loadJSON() {
  const TODO = JSON.parse(localStorage.getItem("todo"));
  const boards = TODO.boards;
  for (let board of boards) {
    createBoard(board.title, board.items);
  }
}

function addItemToList() {
  let input = this.previousElementSibling;
  let board = this.parentElement.parentElement;
  if (!input.value) {
    return;
  }
  createItem(board, input.value);
  input.value = "";
  saveToJSON();
  return false;
}

function createItem(board, text, done = false) {
  const block = document.createElement("div");
  block.classList.add("list__item-block");
  const icon = document.createElement("i");

  const item = document.createElement("div");
  item.classList.add("list__item");
  item.textContent = text;
  item.setAttribute("draggable", true);
  item.setAttribute("done", done);

  if (done === "true") {
    icon.addEventListener("click", killItem);
    icon.classList.add("fa", "fa-trash-alt", "fa-lg");
    item.addEventListener("dblclick", setDoing);
  } else {
    icon.addEventListener("click", setDone);
    icon.classList.add("fa", "fa-check", "fa-lg");
    item.addEventListener("dblclick", changeContent);
  }

  dragNDropItem(item);
  block.append(item, icon);
  board.append(block);
}

function setDone() {
  this.classList.remove("fa-check");
  this.classList.add("fa-trash-alt");
  let item = this.previousElementSibling;
  item.setAttribute("done", true);
  item.removeAttribute("contenteditable");
  item.removeEventListener("dblclick", changeContent);
  item.addEventListener("dblclick", setDoing);
  this.removeEventListener("click", setDone);
  this.addEventListener("click", killItem);
  saveToJSON();
}

function setDoing() {
  let icon = this.nextElementSibling;
  icon.classList.remove("fa-trash-alt");
  icon.classList.add("fa-check");
  icon.removeEventListener("click", killItem);
  icon.addEventListener("click", setDone);
  this.setAttribute("done", false);
  this.removeEventListener("dblclick", setDoing);
  this.addEventListener("dblclick", changeContent);
  saveToJSON();
}

function killItem() {
  this.parentElement.remove();
  saveToJSON();
}

function killThemAll() {
  this.parentElement.parentElement.remove();
  saveToJSON();
}

function changeContent() {
  let currentContent = this.textContent;
  let element = this;
  this.setAttribute("contenteditable", true);
  this.focus();
  this.addEventListener("blur", outOfFocus);
  this.addEventListener("keyup", ctrlEnter);

  function ctrlEnter(e) {
    if ((e.keyCode == 10 || e.keyCode == 13) && (e.ctrlKey || e.metaKey)) {
      outOfFocus();
    }
  }
  function outOfFocus() {
    if (element.textContent.trim() == "") element.textContent = currentContent;
    element.setAttribute("contenteditable", false);
    element.textContent = element.textContent.trim();
    element.removeEventListener("blur", outOfFocus);
    saveToJSON();
  }
}

function createNewBoard() {
  createBoard();
  saveToJSON();
}

function toggleClose() {
  let icon = this.querySelector("i");
  icon.classList.toggle("hidden");
}

function createBoard(title = "Please Change The Title", items = []) {
  const newBoard = document.createElement("div");
  emptyBoard.before(newBoard);

  newBoard.classList.add("board");
  //set color
  if (currentColor++ == colorNames.length - 1) {
    currentColor = 0;
  }
  newBoard.style.backgroundColor = `${COLORS[colorNames[currentColor]]}`;

  newBoard.innerHTML = boardTemplate.querySelector(".board").innerHTML;
  initBoard(newBoard, title);
  for (const item of items) {
    createItem(newBoard, item.text, item.done);
  }
}

function initBoard(board, boardTitle) {
  dragNDropBoard(board);
  const title = board.querySelector(".board__title");
  title.textContent = boardTitle;
  const titleBox = board.querySelector(".board__titleBox");
  titleBox.addEventListener("mouseenter", toggleClose, false);
  titleBox.addEventListener("mouseleave", toggleClose, false);
  const icon = board.querySelector("i");
  icon.addEventListener("click", killThemAll);
  const button = board.querySelector(".board__addButton");
  button.addEventListener("click", addItemToList);
  title.addEventListener("dblclick", changeContent);
}

function saveToJSON() {
  const boards = document.querySelectorAll(".board");
  let boardsSet = [];
  for (let board of boards) {
    if (board.classList.contains("newBoard")) continue;
    const boardObj = {};
    boardObj.title = board.querySelector(".board__title").textContent;
    const items = board.querySelectorAll(".list__item");
    let itemsList = [];
    for (let item of items) {
      itemsList.push({
        text: `${item.textContent}`,
        done: item.getAttribute("done"),
      });
    }
    boardObj.items = itemsList;
    boardsSet.push(boardObj);
    localStorage.setItem("todo", JSON.stringify({ boards: boardsSet }));
  }
}

// Drag and drop part

function dragNDropItem(item) {
  item.addEventListener("dragstart", onDragStart, false);
  item.addEventListener("dragend", onDragEnd, false);
  item.addEventListener(
    "drop",
    function (e) {
      e.preventDefault();
      saveToJSON;
    },
    false
  );

  function onDragStart(e) {
    this.style.opacity = 0.2;
    this.nextElementSibling.style.opacity = 0;
    //trick from Web Dev SImplified
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", null);
  }

  function onDragEnd(e) {
    this.style.opacity = 1;
    this.nextElementSibling.style.opacity = 1;
    this.classList.remove("dragging");
    saveToJSON();
  }
}

function dragNDropBoard(board) {
  board.addEventListener("dragover", onDragOver, false);

  function onDragOver(e) {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (dragging == null) {
      return;
    }

    const afterElement = getDragAfterElement(this, e.clientY);

    if (afterElement == null) {
      this.appendChild(dragging.parentElement);
    } else {
      this.insertBefore(dragging.parentElement, afterElement);
    }
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".list__item-block:not(.dragging)"),
    ];

    //trick from Web Dev SImplified
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
}
