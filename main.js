const { app, BrowserWindow, ipcMain, Notification, ipcRenderer } = require('electron')
const path = require('path')


let win;
let winLogin;
let winProductList;
let winProductAdd;
let winProductUpdate;



var mysql = require('mysql');
const { DEC8_BIN } = require('mysql/lib/protocol/constants/charsets');
const { error } = require('console');
var connection = mysql.createConnection({

  host: 'localhost',
  user: 'root',
  password: null,
  database: 'stoktakipelectron'
});

connection.connect((err) => {
  if (err)
    return console.log(err.stack);

  console.log('Connection is success');
});



//ürün listeleme sayfasına geçiş yapıldı
function productListWindow() {
  winProductList = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true, contextIsolation: false,
      preload: path.join(__dirname, 'main.js'),
      enableRemoteModule: true,
    }
  })

  winProductList.loadFile('productList.html');


  winProductList.webContents.once('dom-ready', () => {
    const querySql = 'select products.id,category_name,product_name,price,stock,description from products INNER JOIN category on products.category_id = category.id';
    connection.query(querySql, (error, results, fields) => {

      winProductList.webContents.send('products', results);
    })
  })
}




//ürün listeleme sayfasından ürün güncelleme sayfasına geçildi.
ipcMain.handle('urunGuncelleSayfasi', (event, urunId) => {//kullanıcı tarafından girilen id değerini ipcMain.handle() fonksiyonu ile tutarız
  const querySql = 'select * from products  where id = ?'; //güncellenmek istenen ürün veritabanın mevcut mu ? sorgusu yapılır
  connection.query(querySql, [urunId], (error, results, fields) => {

    if (error) {
      console.log(error);
    }else if(results[0]['id'] == urunId){//ürün yok ise ürün güncelleme sayfasına geçilmez
      productUpdateWindow(urunId);
      winProductList.close();
    }else {
      new Notification({
        title: 'Güncelleme',
        body: 'ürün kaydı bulunamadı'
      }).show()
    }
  })
});



//ürün güncelleme sayfası açıldı
function productUpdateWindow(urunId) {
  winProductUpdate = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      nodeIntegration: true, contextIsolation: false,
      preload: path.join(__dirname, 'main.js'),
      enableRemoteModule: true,
    }
  })
  winProductUpdate.loadFile('productUpdate.html')


  //Gelen id ye göre ürün bilgileri inputlara otomatik değerleri çekiyoruz

  winProductUpdate.webContents.once('dom-ready', () => {
    const querySql = 'select products.id,category_name,product_name,price,stock,description from products INNER JOIN category on products.category_id = category.id where products.id = ?'

    connection.query(querySql, [urunId], (error, results, fields) => {
      if (error) {
        console.log(error);
      }

      winProductUpdate.webContents.send('products', results);
      console.log(results);
    })
  })
}


ipcMain.handle('urunGuncelle', (event, veri) => {//kullanıcı tarafından girilen bilgileri ipcMain.handle() fonksiyonu ile tutarız
  urunGuncelle(veri);//gelen verileri urunGuncelle fonsksiyonuna yolluyoruz
});

//ürün güncelleme işlemi
function urunGuncelle(veri) {
  const urunID = veri.urunId;
  const urunAd = veri.urunAd;
  const fiyat = veri.fiyat;
  const stok = veri.stok;
  const aciklama = veri.aciklama;
  const querySql = 'update products set product_name = ?, price = ?, stock = ?, description = ? where id = ? '
  connection.query(querySql, [urunAd, fiyat, stok, aciklama, urunID], (error, results) => {
    if (error) {
      console.log(error);
      new Notification({
        title: 'Güncelleme',
        body: 'ürün güncellenemedi'
      }).show()
    }
    else {
      new Notification({
        title: 'Güncelleme',
        body: 'ürün başarıyla güncellendi'
      }).show()
    }
  });

}


//ürün güncelleme sayfasından ürün listeleme sayfasına geri dönüldü.
ipcMain.handle('productUpdateList', (event) => {
  productListWindow();
  winProductUpdate.close();
});


//ürün ekleme sayfasına geçiş yapıldı
function productAddWindow() {
  winProductAdd = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      nodeIntegration: true, contextIsolation: false,
      preload: path.join(__dirname, 'main.js'),
      enableRemoteModule: true,
    }
  })


  winProductAdd.loadFile('productAdd.html')

}

//ürün ekleme sayfasına geçiş yapıldı
ipcMain.handle('productListAdd', (event) => {
  productAddWindow();
  winProductList.close();
});

//ürün ekleme sayfasından ürün listelemeye geri dönülme işlemi yapıldı
ipcMain.handle('productAddList', (event) => {
  productListWindow();
  winProductAdd.close();
});







ipcMain.handle('urunSil', (event, urunId) => {//kullanıcı tarafından girilen id değerini ipcMain.handle() fonksiyonu ile tutarız
  urunSil(urunId);//gelen veriyi urunSil fonsksiyonuna yolluyoruz
});

//ürün silme işlemi
function urunSil(urunId) {
  const urunID = urunId;

  const querySql = 'delete from products where id = ?';
  connection.query(querySql, [urunID], (error, results) => {
    if (error) {
      console.log(error);
    } else if (results.affectedRows == 0) {//etkilenen satır yoksa ürün kaydı yoktur
      new Notification({
        title: 'kaydı silinme',
        body: 'Ürün kaydı zaten yok'
      }).show()
    }
    else {
      new Notification({
        title: 'kayıt silinme',
        body: 'Ürün kaydı başarılı bir şekilde silindi'
      }).show()
    }
  });
  ipcMain.handle('productUpdateList', (event) => {
    productListWindow();
    winProductUpdate.close();
  });


}


//eklenilcek ürünün verilerini kullanıcıdan alıyoruz ve urunEkle fonksiyonuna gönderiyoruz
ipcMain.handle('urunEkle', (event, veri) => {
  urunEkle(veri);
});

//ürün ekleme işlemi
function urunEkle(veri) {

  const urunAd = veri.urunAd;
  const kategori = veri.kategori;
  const stok = veri.stok;
  const fiyat = veri.fiyat;
  const aciklama = veri.aciklama;


  const querySql = 'insert into products(category_id,product_name,price,stock,description) values(?,?,?,?,?)'
  connection.query(querySql, [kategori, urunAd, stok, fiyat, aciklama], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      new Notification({
        title: 'kayıt',
        body: 'kayıt başarılı'
      }).show()
    }
  });
}



app.whenReady().then(loginWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    productListWindow();
  }
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


//login sayfasının açılımı yapıldı
function loginWindow() {
  winLogin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, contextIsolation: false,
      preload: path.join(__dirname, 'login.js'),
      enableRemoteModule: true,
    }
  })

  winLogin.loadFile("login.html")

}


//login page üzerinden gelen obj değişkenini loginValidate fonksiyonuna gönderdik
ipcMain.handle('login', (event, obj) => {
  loginValidate(obj);
});


//Giriş işlemi sırasın kullanıcı kayıt sorugusu
function loginValidate(obj) {
  const username = (obj.username);
  const password = (obj.password);

  const querySql = 'select * from users where username = ? and password = ?'
  connection.query(querySql, [username, password], (error, results) => {
    if (error) {
      console.log(error);
    }
    if (results.length > 0) {//sonuç bir dizi olarak döner ve uzunluk yani veri mevcutsa giriş sağlanırNpm install  mysql
      productListWindow();
      winProductList.show();
      winLogin.close();
    } else {
      new Notification({
        title: 'login',
        body: 'username or password error'
      }).show()
    }
  });

}






