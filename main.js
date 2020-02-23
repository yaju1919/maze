(function() {
    'use strict';
    var h = $("<div>").appendTo($("body").css({
        "text-align": "center"
    }));
    $("<h1>").text("迷路自動生成").appendTo(h);
    var ui = $("<div>").appendTo(h);
    var result_cv = $("<div>").appendTo(h);
    var result = $("<div>").appendTo(h);
    function addBtn(title, func){
        return $("<button>",{text:title}).click(func).appendTo(ui);
    }
    //---------------------------------------------------------------------------------
    var width = yaju1919.addInputNumber(ui,{
        title: "幅",
        max: 999,
        min: 5,
        value: 49,
        save: "w",
        change: function(n){
            if(height) showExpect(n - 1, height());
            if(!(n % 2)) return n - 1;
        }
    });
    var height = yaju1919.addInputNumber(ui,{
        title: "高さ",
        max: 999,
        min: 5,
        value: 49,
        save: "h",
        change: function(n){
            showExpect(width(), n - 1);
            if(!(n % 2)) return n - 1;
        }
    });
    var dot = yaju1919.addInputNumber(ui,{
        title: "描画px",
        max: 30,
        min: 1,
        value: 10,
        save: "px",
    });
    var wait = yaju1919.addInputNumber(ui,{
        title: "wait[ミリ秒]",
        max: 1000,
        min: 0,
        int: true,
        value: 30,
        save: "wait",
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
        save: "x",
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
        save: "y",
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
    var g_timeoutID = [], g_strMass;
    //---------------------------------------------------------------------------------------------------------
    addBtn("壁延ばし法で自動生成",main_extend);
    function main_extend(){
        while(g_timeoutID.length) clearTimeout(g_timeoutID.pop());
        var w = width(),
            h = height(),
            unused = [],
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
            for(var x = 0; x < w; x++){ // x, yともに偶数となる座標を壁延ばし開始座標
                if(!(x % 2) && !(y % 2)) unused.push([x,y]);
            }
        }
        var stack;
        result.empty();
        function main2(){
            if(!unused.length) { // すべての処理の終わり
                g_strMass = mass.map(function(v){
                    return v.join('');
                }).join('\n');
                return yaju1919.addInputText(result,{
                    title: "output",
                    readonly: true,
                    textarea: true,
                    value: g_strMass,
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
        function extendMaze(xy){ // 壁延ばし本処理
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
                return g_timeoutID.push(setTimeout(function(){ extendMaze(prev) },wait()));
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
                    return g_timeoutID.push(setTimeout(main2,wait()));
                }
                // 通路の場合
                stack.push([x,y]);
                g_timeoutID.push(setTimeout(function(){ extendMaze(next) },wait()));
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
        var road = [[firstX,firstY]],
            paint = makeCanvas(w,h),
            unpaved = ( w - 1 ) * ( h - 1 ) / 4 - 1;
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
        result.empty();
        function main2(){
            if(!unpaved) { // すべての処理の終わり
                mass.forEach(function(v,i){
                    v.forEach(function(v2,i2){
                        if( i === 0 || i=== h - 1 || i2 === 0 || i2 === w - 1 ) v[i2] = 1;
                    });
                });
                g_strMass = mass.map(function(v){
                    return v.join('');
                }).join('\n');
                return yaju1919.addInputText(result,{
                    title: "output",
                    readonly: true,
                    textarea: true,
                    value: g_strMass,
                });
            }
            var idx = yaju1919.randInt(0, road.length - 1);
            var xy = road[idx];
            road.splice(idx, 1);
            if(xy) extendMaze(xy);
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
                return g_timeoutID.push(setTimeout(main2,wait()));
            }
            else {
                if(nexts.length > 1) road.push([x,y]);
                var next = yaju1919.randArray(nexts);
                fillMass((x + (next[0] - x) / 2), (y + (next[1] - y) / 2), 0); // 奇数マス
                unpaved--;
                g_timeoutID.push(setTimeout(function(){ extendMaze(next) },wait()));
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------
    var rate = yaju1919.addInputNumber(ui,{
        title: "倍率",
        id: "rate",
        placeholder: "整数倍",
        min: 1,
        max: 5,
        value: 2,
        int: true,
        save: "rate",
        change: function(){
            showExpect(width(),height());
        }
    });
    var expect = $("<div>").appendTo(ui);
    function showExpect(w,h){;
        var w2 = ( w - 1 ) / 2 * rate() + w / 2 + 1,
            h2 = ( h - 1 ) / 2 * rate() + h / 2 + 1;
        if(expect) expect.text("拡大後の幅:" + w + ", 高さ:" + h);
    }
    $("#rate").trigger("change");
    addBtn("迷路の通路を拡大",expansion);
    function expansion(){
        function amp(str,rate){ // 文字列, 倍率
            return str.split('\n').map(function(line,y){
                var s = line.split('').map(function(c,x){
                    return x % 2 ? yaju1919.repeat(c,rate) : c;
                }).join('') + '\n';
                return y % 2 ? yaju1919.repeat(s,rate) : s;
            }).join('').slice(0,-1);
        }
        if(!g_strMass) return;
        var rslt = amp(g_strMass,rate());
        yaju1919.addInputText(result.empty(),{
            title: "output",
            readonly: true,
            textarea: true,
            value: rslt,
        });
        var fill = makeCanvas(w,h);
        rslt.split('\n').forEach(function(line,y){
            line.split('').forEach(function(c,x){
                if(c === '1') fill(x,y,"red");
            });
        });
    }
})();
