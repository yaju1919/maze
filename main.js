(function() {
    'use strict';
    var h = $("<div>").appendTo($("body").css({
        "text-align": "center"
    }));
    var ui = $("<div>").appendTo(h);
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
    function main(){
        var w = width(),
            h = height();
        var evenNums = [],
            mass = [];
        for(var y = 0; y < h; y++){ // 迷路の外周を壁
            mass.push(((!y || y === h - 1) ? (
                yaju1919.repeat('1', w)
            ) : (
                '1' + yaju1919.repeat('0', w - 2) + '1'
            )).split('').map(function(c){
                return Number(c);
            }));
            for(var x = 0; x < w; x++){ // x, yともに偶数となる座標を壁伸ばし開始座標
                if(!(x % 2) && !(y % 2)) evenNums.push([x,y]);
            }
        }
        var unused = yaju1919.shuffle(evenNums), stack;
        while(unused.length){
            var idx = yaju1919.randInt(0, unused.length - 1);
            var xy = unused[idx];
            if(!mass[xy[1]][xy[0]]){ // 通路の場合のみ
                stack = [];
                extendMaze(xy);
            }
            unused.splice(idx, 1);
        }
        yaju1919.addInputText(result.empty(),{
            title: "output",
            readonly: true,
            textarea: true,
            value: mass.map(function(v){
                return v.join('');
            }).join('\n'),
        });
        function extendMaze(xy){ // 壁伸ばし本処理
            var x = xy[0],
                y = xy[1];
            mass[y][x] = -1; // 現在拡張中: -1
            var nexts = [
                [x + 2, y],
                [x - 2, y],
                [x, y + 2],
                [x, y - 2],
            ].filter(function(v){
                return mass[v[1]][v[0]] !== -1;
            });
            if(!nexts.length) return extendMaze(stack.pop()); // 四方がすべて現在拡張中の壁の場合
            else {
                var next = yaju1919.randArray(nexts);
                mass[y + (next[1] - y) / 2][x + (next[0] - x) / 2] = 1; // 奇数マス
                if(next) { // 壁の場合
                    return mass.forEach(function(v){
                        v.forEach(function(v2,i){
                            v[i] = v2 === -1 ? 1 : v2; // 拡張中を確定に
                        });
                    });
                }
                stack.push([x,y]);
                extendMaze(next); // 通路の場合
            }
        }
    }
    addBtn("自動生成",main);
})();
