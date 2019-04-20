var urlList = [];

window.onload = function () {
  document.getElementById('saveAll').addEventListener('click', saveAllTabs);
  document.getElementById('saveCurrent').addEventListener('click', saveCurrentTab);

  chrome.storage.sync.get('tabStorage', function (tabs) {
    if (!tabs.tabStorage) return;
    for (var i = 0; i < tabs.tabStorage.length; i++) {
      addToList(tabs.tabStorage[i], Array.isArray(tabs.tabStorage[i]));
    }
  });
}

function Item(title, links, passwordHash) {
  this.title = title;
  this.urls = links;
  this.passwordHash = passwordHash;
}

function saveAllTabs() {
  var title = document.getElementById('title').value || 'MultipleTabs';
  var password = document.getElementById('password').value || '';
  var passwordHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);
  
  chrome.tabs.query({
    currentWindow: true
  }, function (tabs) {
    var arr = [];
    tabs.forEach(function (tab) {
      arr.push(CryptoJS.AES.encrypt(String(tab.url), String(password)));
    });
    addToList(new Item(title, arr, passwordHash));
    chrome.storage.sync.set({
      'tabStorage': urlList
    });
  });
}

function saveCurrentTab() {
  var title = document.getElementById('title').value;
  var password = document.getElementById('password').value || '';
  var passwordHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);

  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tab) {
    tab[0].title = title || tab[0].title;
    tab[0].url = CryptoJS.AES.encrypt(tab[0].url, String(password));
    addToList(new Item(tab[0].title, [tab[0].url], passwordHash));
    chrome.storage.sync.set({
      'tabStorage': urlList
    });
  });
}

function addToList(tabs) {
  urlList.push(tabs);
  var myList = document.getElementById("list");
  var link = document.createElement('a');
  var close = document.createElement('img');
  close.height = 12;
  close.src = 'close.png';

  link.innerText = tabs.title;
  link.addEventListener('click', (function (tabs) {
    return function () {
      var password = document.getElementById('password').value || '';
      if(CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64) !== tabs.passwordHash) {
        return; // Wrong Password
      }
      for (var i = 0; i < tabs.urls.length; i++) {
        var link = CryptoJS.AES.decrypt(tabs.urls[i], String(password)).toString(CryptoJS.enc.Utf8);
        chrome.tabs.create({
          url: link
        });
      }
    }
  })(tabs));

  close.addEventListener('click', function (e) {
    const index = $(e.target.parentNode).index();
    urlList.splice(index, 1);
    $('#list li').eq(index).remove();
    chrome.storage.sync.set({
      'tabStorage': urlList
    });
  })

  link.href = '#';
  var item = document.createElement('li');
  item.appendChild(close);
  item.appendChild(link);
  myList.appendChild(item);
}