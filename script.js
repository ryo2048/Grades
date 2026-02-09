let subjects = JSON.parse(localStorage.getItem("subjects") || "[]");
const container = document.getElementById("subjects");
let isDragging = false;

document.getElementById("addBtn")
    .addEventListener("click", addSubject);

function save(){
    localStorage.setItem("subjects",JSON.stringify(subjects));
    calcOverall(); // ←追加（超重要）
}

//////////////////////////////////////////////////////////
// カード生成（← renderしない。生成だけ）
//////////////////////////////////////////////////////////

function createCard(sub,i){
    // ★★★ 保険（これ超重要） ★★★
    if(!Array.isArray(sub.scores)){
        sub.scores = [0,0,0,0];
    }
    if(typeof sub.assignment !== "number"){
        sub.assignment = 0;
    }

    const handle=document.createElement("span");
    handle.className="drag-handle";
    handle.textContent="≡";

    const card=document.createElement("div");
    card.className="card";

    const row=document.createElement("div");
    row.className="subject-row";

    const name=document.createElement("b");
    name.textContent=sub.name;

    const edit=document.createElement("button");
    edit.className="edit-mini";
    edit.textContent="✏️";

    const del=document.createElement("button");
    del.className="delete-mini";
    del.textContent="×";

    row.append(handle,name,edit,del);
    card.appendChild(row);

    /////////////////////////////////////////////
    // 開閉（再描画なし！！！）
    /////////////////////////////////////////////

    handle.addEventListener("click",(e)=>{
        e.stopPropagation();
    });

    card.addEventListener("click",(e)=>{

        if(isDragging) return;
        if(e.target.closest(".drag-handle")) return;
        if(e.target.closest("button")) return;

        if(card.querySelector(".detail")){
            card.querySelector(".detail").remove();
            return;
        }

        closeAllCards();

        const detail=createDetail(sub);
        card.appendChild(detail);

        updateCardColor(card,sub);
    });



    /////////////////////////////////////////////
    // 編集
    /////////////////////////////////////////////

    edit.addEventListener("click",(e)=>{
        e.stopPropagation();
        openEditModal(sub, name, card);
    });

    function openEditModal(sub, nameElem, card){
    
        // 背景
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.4);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:1000;
        `;
    
        // モーダル本体
        const modal = document.createElement("div");
        modal.style.cssText = `
            background:#fff;
            padding:16px;
            border-radius:8px;
            min-width:260px;
            box-shadow:0 10px 30px rgba(0,0,0,.3);
        `;
    
        modal.innerHTML = `
            <div>
                科目名<br>
                <input id="editName" value="${sub.name}">
            </div>
            <div style="margin-top:8px">
                試験割合（0〜1）<br>
                <input id="editRate" type="number" step="0.1" value="${sub.rate}">
            </div>
            <div style="margin-top:12px; text-align:right">
                <button id="cancel">Cancel</button>
                <button id="ok">OK</button>
            </div>
        `;
    
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    
        // 閉じる共通処理
        const close = () => overlay.remove();
    
        overlay.addEventListener("click", close);
        modal.addEventListener("click", e => e.stopPropagation());
    
        modal.querySelector("#cancel").onclick = close;
    
        modal.querySelector("#ok").onclick = () => {
            const newName = modal.querySelector("#editName").value.trim();
            const rateNum = parseFloat(modal.querySelector("#editRate").value);
    
            if(!newName || isNaN(rateNum)){
                alert("正しく入力してください！");
                return;
            }
    
            sub.name = newName;
            sub.rate = rateNum;
            nameElem.textContent = newName;
    
            save();
    
            const detail = card.querySelector(".detail");
            if(detail) updateResult(detail, sub);
            updateCardColor(card, sub);
    
            close();
        };
    }

    /////////////////////////////////////////////
    // 削除
    /////////////////////////////////////////////

    del.addEventListener("click",(e)=>{
        e.stopPropagation();

        if(!confirm("削除しますか？")) return;

        const index = subjects.indexOf(sub);
        subjects.splice(index,1);
        card.remove();
        save();
    });

    updateCardColor(card,sub);

    return card;
}

//////////////////////////////////////////////////////////
// detail生成
//////////////////////////////////////////////////////////

function createDetail(sub){

    const detail=document.createElement("div");
    detail.className="detail";

    detail.innerHTML=`
<hr>

前期中間<input type="number" value="${sub.scores[0]}">
前期期末<input type="number" value="${sub.scores[1]}">
後期中間<input type="number" value="${sub.scores[2]}">
後期期末<input type="number" value="${sub.scores[3]}">
課題点<input type="number" value="${sub.assignment}">

<div class="result"></div>
`;

    const inputs=detail.querySelectorAll("input");

    inputs.forEach((input,index)=>{

        input.addEventListener("click",(e)=>e.stopPropagation());

        input.addEventListener("input",()=>{

            if(index<4){
                sub.scores[index]=parseFloat(input.value)||0;
            }else{
                sub.assignment=parseFloat(input.value)||0;
            }

            updateResult(detail,sub);
            save();
        });
    });

    updateResult(detail,sub);

    return detail;
}

//////////////////////////////////////////////////////////
// 合否計算
//////////////////////////////////////////////////////////

function calcAverage(scores){
    const valid=scores.filter(s=>s>0);
    if(!valid.length) return 0;
    return valid.reduce((a,b)=>a+b,0)/valid.length;
}

function updateResult(detail,sub){

    const examAvg = calcAverage(sub.scores);
    const final = examAvg*sub.rate + sub.assignment;
    const finalCeil = Math.ceil(final);
    const pass = finalCeil >= 60; // ←ここもceil基準が自然

    const result=detail.querySelector(".result");

    result.className="result "+(pass?"pass":"fail");

    result.innerHTML=`
試験平均：${examAvg.toFixed(1)}<br>
最終成績：${final.toFixed(1)} (${finalCeil})<br>
${pass?"✅ 合格":"❌ 不合格"}
`;

    const card = detail.closest(".card");
    if(card){
        updateCardColor(card,sub);
    }
}

function calcOverall(){

    let mid1=0, mid1Count=0;
    let final1=0, final1Count=0;
    let mid2=0, mid2Count=0;
    let final2=0, final2Count=0;

    subjects.forEach(sub=>{

        const s=sub.scores;
        const assign=sub.assignment;

        // ✅ 前期中間（0は除外）
        if(s[0] > 0){
            mid1 += s[0];
            mid1Count++;
        }

        // ✅ 前期期末（両方入力されている時だけ）
        const firstAvg = calcAverage([s[0], s[1]]);

        if(firstAvg > 0){
            const firstFinal = Math.ceil(firstAvg * sub.rate + assign);
            final1 += firstFinal;
            final1Count++;
        }

        // ✅ 後期中間
        if(s[2] > 0){
            mid2 += s[2];
            mid2Count++;
        }

        // 後期期末（0を除外して平均）
        const examAvg = calcAverage(s);

        if(examAvg > 0){
            const secondFinal = Math.ceil(examAvg * sub.rate + assign);
            final2 += secondFinal;
            final2Count++;
        }
    });

    // ★ 分母0対策（これ超重要）
    const avg = (sum,count)=> count ? (sum/count).toFixed(1) : "-";

    document.getElementById("overallResult").innerHTML=`
前期中間：${avg(mid1,mid1Count)}<br>
前期期末：${avg(final1,final1Count)}<br>
後期中間：${avg(mid2,mid2Count)}<br>
後期期末：${avg(final2,final2Count)}
`;
}

//////////////////////////////////////////////////////////
// カード色更新
//////////////////////////////////////////////////////////

function updateCardColor(card,sub){

    card.classList.remove("pass-card","fail-card");

    const avg=calcAverage(sub.scores);
    const final = avg*sub.rate+sub.assignment;
    const finalCeil = Math.ceil(final);
    
    if(finalCeil>=60){
        card.classList.add("pass-card");
    }else if(final>0){
        card.classList.add("fail-card");
    }
}

//////////////////////////////////////////////////////////
// 全カード閉じる
//////////////////////////////////////////////////////////

function closeAllCards(){
    document.querySelectorAll(".detail").forEach(d=>d.remove());
}

//////////////////////////////////////////////////////////
// 科目追加（ここだけカード生成）
//////////////////////////////////////////////////////////

function addSubject(){

    const name=document.getElementById("name").value;
    const rate=parseFloat(document.getElementById("rate").value);

    if(!name || isNaN(rate)){
        alert("入力してください！");
        return;
    }

    const sub={
        name,
        rate,
        scores:[0,0,0,0],
        assignment:0
    };

    subjects.push(sub);
    save();

    const card=createCard(sub,subjects.length-1);
    container.appendChild(card);

    document.getElementById("name").value="";
    document.getElementById("rate").value="";
}

//////////////////////////////////////////////////////////
// 初期ロード（←ここだけ一括生成）
//////////////////////////////////////////////////////////

subjects.forEach((sub,i)=>{
    container.appendChild(createCard(sub,i));
});

calcOverall(); // ←追加

//////////////////////////////////////////////////////////
// Sortable（超安定版）
//////////////////////////////////////////////////////////

if(container){
    new Sortable(container,{
        animation:150,
        ghostClass:"sortable-ghost",
        handle: ".drag-handle",
        onStart: () => isDragging = true,
        onEnd: (evt) => {
            const moved = subjects.splice(evt.oldIndex,1)[0];
            subjects.splice(evt.newIndex,0,moved);
            save();
            closeAllCards();
            setTimeout(()=> isDragging = false, 0);
        }
    });
}
