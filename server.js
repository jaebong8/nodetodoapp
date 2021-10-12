const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
app.set('view engine','ejs');
app.use('/public', express.static('public'));
app.use('/views',express.static('views'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
require('dotenv').config()

const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL,function(에러, client){
    if(에러) {return console.log(에러)}

    db = client.db('todoapp');

    

    http.listen(process.env.PORT, function(){
        console.log('listening on 8080')
    });

})












app.get('/pet',function(요청, 응답){
    응답.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/beauty',function(요청, 응답){
    응답.send('뷰티용품을 쇼핑할 수 있는 페이지입니다.');
});

app.get('/',function(요청, 응답){
    응답.render('index.ejs')
});

app.get('/write',function(요청, 응답){
    응답.render("write.ejs")
});



app.get('/list',function(요청,응답){
    db.collection('post').find().toArray(function(에러, 결과){
        
        응답.render('list.ejs', {posts : 결과});
    });


    

});






app.get('/detail/:id',function(요청,응답){
    db.collection('post').findOne({_id: parseInt(요청.params.id)},function(에러,결과){
        
        응답.render('detail.ejs',{ data : 결과});
    })
    
})

app.get('/edit/:id',function(요청,응답){
    db.collection('post').findOne({_id: parseInt(요청.params.id)},function(에러,결과){
        console.log(결과)
        응답.render('edit.ejs', {data : 결과})
    })
    
})

app.put('/edit',function(요청,응답){
    db.collection('post').updateOne({_id: parseInt(요청.body.id)},{ $set : {제목: 요청.body.title,날짜: 요청.body.date}},function(에러,결과){
        console.log('수정완료')
        응답.redirect('list')
    })
    
})

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session')

app.use(session({secret : '비밀코드', resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',function(요청,응답){
    
    응답.render('login.ejs');
})
app.post('/login',passport.authenticate('local',{
    failureRedirect : '/fail'
}), function(요청,응답){
    응답.redirect('/');
})



app.get('/mypage',로그인했니,function(요청,응답){
    console.log(요청.user);
    응답.render('mypage.ejs',{사용자 : 요청.user})
})

function 로그인했니(요청,응답,next){
    if (요청.user){
        next()
    } else {
        응답.send('로그인 안하셨는데요?')
    }
}

app.get('/search',(요청,응답)=>{
    const 검색조건 = [{
        $search: {
          index: 'titleSearch',
          text: {
            query: 요청.query.value,
            path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      }]


    db.collection('post').aggregate(검색조건).toArray((에러,결과)=>{
        console.log(결과);
        응답.render('result.ejs',{result : 결과})
    })
    
})









passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));


  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id: 아이디},function(에러,결과){
        done(null, 결과)
    })
    
  }); 


  app.delete('/delete', function(요청,응답){
    
    요청.body._id = parseInt(요청.body._id);

    const 삭제할데이터 = {_id : 요청.body._id, 작성자 : 요청.user._id}
    
    db.collection('post').deleteOne(삭제할데이터, function(에러,결과){
        console.log('삭제완료');
        if (에러) {alert('본인이 아닙니다')}
        
    })


    응답.send('삭제완료');
})


  app.post('/add',function(요청,응답){
    
    
    db.collection('counter').findOne({name:'게시물갯수'}, function(에러,결과){
        console.log(결과.totalPost);
        let 총게시물갯수 = 결과.totalPost;

        const 저장할거 = {_id: 총게시물갯수+1 ,작성자: 요청.user._id, 제목 : 요청.body.title, 날짜 : 요청.body.date}

    db.collection('post').insertOne( 저장할거,function(에러,결과){
        console.log('저장완료');
        });
        db.collection('counter').updateOne({name:'게시물갯수'},{ $inc : {totalPost:1}},function(에러,결과){
            console.log('업데이트 완료했어요');
            
        })
    응답.redirect('list')

    });
    


    
});


  app.post('/register', function(요청,응답){
    db.collection('login').insertOne({id : 요청.body.id, pw: 요청.body.pw},function(){
        응답.redirect('/')
    })
  })

  let multer =require('multer');
  const storage = multer.diskStorage({
      destination: function(req,file,cb){
          cb(null,'./public/image')
      },
      filename: function(req,file,cb){
        cb(null,file.originalname)
      }
  })

  const upload = multer({storage: storage})


  app.get('/upload',function(요청,응답 ){
    응답.render('upload.ejs')
  })

  app.post('/upload',upload.array('업로드', 10),function(요청,응답){
    응답.send('업로드 완료')
  })

  app.get('/img/:imageName',function(요청,응답){
      응답.sendFile(__dirname + '/public/img' + 요청.params.imageName)
  })

  app.get('/chat',function(요청,응답){
      응답.render('chat.ejs')
  })

  io.on('connection',function(socket){
    console.log('연결되었습니다.')

    socket.on('인삿말',function(data){
        console.log('인삿말이 수신되었습니다.',data)
        io.emit('퍼트리기',data)
    })
  })

  const chat1 = io.of('/채팅방1');

  chat1.on('connection',function(socket){
    console.log('채팅방1입니다.')

    socket.on('인삿말',function(data){
        console.log('인삿말이 수신되었습니다.',data)
        chat1.emit('퍼트리기',data)
    })
  })

