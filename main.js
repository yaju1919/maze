(function() {
    'use strict';
    var h = $("<div>").appendTo($("body").css({
        "text-align": "center"
    }));
    $("<h1>").text("迷路自動生成（壁伸ばし法）").appendTo(h);
    var ui = $("<div>").appendTo(h);
    var result_cv = $("<div>").appendTo(h);
    var result = $("<div>").appendTo(h);
    function addBtn(title, func){
        return $("<button>",{text:title}).click(func).appendTo(ui);
    }
    //---------------------------------------------------------------------------------
    var width = yaju1919.addInputNumber(ui,{
        title: "幅",
        max: 299,
        min: 5,
        value: 49,
        change: function(n){
            if(!(n % 2)) return n - 1;
        }
    });
    var height = yaju1919.addInputNumber(ui,{
        title: "高さ",
        max: 299,
        min: 5,
        value: 49,
        change: function(n){
            if(!(n % 2)) return n - 1;
        }
    });
    var dot = yaju1919.addInputNumber(ui,{
        title: "描画px",
        max: 30,
        min: 1,
        value: 10,
    });
    var speed = yaju1919.addInputNumber(ui,{
        title: "描画間隔[ミリ秒]",
        max: 1000,
        min: 0,
        int: true,
        value: 30,
    });
    yaju1919.addHideArea(ui,{
        title: "穴掘り法の開始座標",
        id2: "dig"
    });
    ui.append("<br>");
    var startX = yaju1919.addInputNumber("#dig",{
        title: "X座標",
        min: 1,
        int: true,
        value: 1,
        change: function(n){
            if(n > width()) n = width() - 1;
            if(!(n % 2)) n--;
            return n;
        }
    });
    var startY = yaju1919.addInputNumber("#dig",{
        title: "Y座標",
        min: 1,
        int: true,
        value: 1,
        change: function(n){
            if(n > height()) n = height() - 1;
            if(!(n % 2)) n--;
            return n;
        }
    });
    function makeCanvas(w,h){
        var px = dot();
        var cv = $("<canvas>").attr({
            width: w * px,
            height: h * px
        }).appendTo(result_cv.empty())[0];
        var ctx = cv.getContext('2d');
        return function(x,y,color){
            ctx.fillStyle = color;
            ctx.fillRect(x * px, y * px, px, px);
        };
    }
    var g_timeoutID = [];
    //---------------------------------------------------------------------------------------------------------
    addBtn("壁伸ばし法で自動生成",main_extend);
    function main_extend(){
        while(g_timeoutID.length) clearTimeout(g_timeoutID.pop());
        var w = width(),
            h = height(),
            evenNums = [],
            mass = [];
        var paint = makeCanvas(w,h);
        for(var y = 0; y < h; y++){ // 迷路の外周を壁
            mass.push(((!y || y === h - 1) ? (
                yaju1919.repeat('1', w)
            ) : (
                '1' + yaju1919.repeat('0', w - 2) + '1'
            )).split('').map(function(c,x){
                var n = Number(c);
                if(n) paint(x,y,'blue');
                return n;
            }));
            for(var x = 0; x < w; x++){ // x, yともに偶数となる座標を壁伸ばし開始座標
                if(!(x % 2) && !(y % 2)) evenNums.push([x,y]);
            }
        }
        var unused = yaju1919.shuffle(evenNums), stack;
        result.empty();
        function main2(){
            if(!unused.length) { // すべての処理の終わり
                return yaju1919.addInputText(result,{
                    title: "output",
                    readonly: true,
                    textarea: true,
                    value: mass.map(function(v){
                        return v.join('');
                    }).join('\n'),
                });
            }
            var idx = yaju1919.randInt(0, unused.length - 1);
            var xy = unused[idx];
            unused.splice(idx, 1);
            if(!mass[xy[1]][xy[0]]){ // 通路の場合のみ
                stack = [];
                extendMaze(xy);
            }
            else main2();
        }
        main2();
        function fillMass(x,y,value){
            mass[y][x] = value;
            paint(x,y, value === 1 ? 'blue' : 'orange');
        }
        function extendMaze(xy){ // 壁伸ばし本処理
            var x = xy[0],
                y = xy[1];
            fillMass(x,y,-1);
            var nexts = [
                [x + 2, y],
                [x - 2, y],
                [x, y + 2],
                [x, y - 2],
            ].filter(function(v){
                return mass[v[1]][v[0]] !== -1;
            });
            if(!nexts.length) { // 四方がすべて現在拡張中の壁の場合
                var prev = stack.pop();
                return g_timeoutID.push(setTimeout(function(){ extendMaze(prev) },speed()));
            }
            else {
                var next = yaju1919.randArray(nexts);
                fillMass((x + (next[0] - x) / 2), (y + (next[1] - y) / 2), -1); // 奇数マス
                if(mass[next[1]][next[0]]) { // 壁の場合
                    mass.forEach(function(v,y){
                        v.forEach(function(v2,x){
                            if(v2 === -1) fillMass(x,y,1);
                        });
                    });
                    return g_timeoutID.push(setTimeout(main2,speed()));
                }
                // 通路の場合
                stack.push([x,y]);
                g_timeoutID.push(setTimeout(function(){ extendMaze(next) },speed()));
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------
    addBtn("穴掘り法で自動生成",main_dig);
    function main_dig(){
        while(g_timeoutID.length) clearTimeout(g_timeoutID.pop());
        var w = width(),
            h = height(),
            mass = [],
            firstX = startX(),
            firstY = startY();
        if(firstX > w) firstX = w;
        if(firstY > h) firstY = h;
        var paint = makeCanvas(w,h);
        for(var y = 0; y < h; y++){ // 迷路の外周以外を壁
            mass.push(((!y || y === h - 1) ? (
                yaju1919.repeat('0', w)
            ) : (
                '0' + yaju1919.repeat('1', w - 2) + '0'
            )).split('').map(function(c,x){
                var n = Number(c);
                paint(x,y,'green');
                return n;
            }));
        }
        var road = [[firstX,firstY]];
        result.empty();
        function main2(){
            if(!road.length) { // すべての処理の終わり
                mass.forEach(function(v,i){
                    v.forEach(function(v2,i2){
                        if( i === 0 || i=== h - 1 || i2 === 0 || i2 === w - 1 ) v[i2] = 1;
                    });
                });
                return yaju1919.addInputText(result,{
                    title: "output",
                    readonly: true,
                    textarea: true,
                    value: mass.map(function(v){
                        return v.join('');
                    }).join('\n'),
                });
            }
            var idx = yaju1919.randInt(0, road.length - 1);
            var xy = road[idx];
            road.splice(idx, 1);
            extendMaze(xy);
        }
        main2();
        function fillMass(x,y,value){
            mass[y][x] = value;
            paint(x,y,'white');
        }
        function extendMaze(xy){ // 穴掘り本処理
            var x = xy[0],
                y = xy[1];
            fillMass(x,y,0);
            var nexts = [
                [x + 2, y],
                [x - 2, y],
                [x, y + 2],
                [x, y - 2],
            ].filter(function(v){
                var x = v[0],
                    y = v[1];
                if(x < 0 || x > w - 1) return;
                if(y < 0 || y > h - 1) return;
                return mass[y][x] === 1;
            });
            if(!nexts.length) { // 四方がすべて現在拡張中の通路の場合
                return g_timeoutID.push(setTimeout(main2,speed()));
            }
            else {
                if(nexts.length > 1) road.push([x,y]);
                var next = yaju1919.randArray(nexts);
                fillMass((x + (next[0] - x) / 2), (y + (next[1] - y) / 2), 0); // 奇数マス
                g_timeoutID.push(setTimeout(function(){ extendMaze(next) },speed()));
            }
        }
    }
})();
