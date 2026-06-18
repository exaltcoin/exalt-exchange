import "./AINews.css";

export default function AINews() {

const news = [
{
coin:"BTC",
title:"Bitcoin ETF inflows increasing",
sentiment:"Bullish",
score:"93%"
},
{
coin:"ETH",
title:"Ethereum whale accumulation detected",
sentiment:"Bullish",
score:"89%"
},
{
coin:"SOL",
title:"Solana network activity surges",
sentiment:"Positive",
score:"85%"
}
];

return(
<div className="news-page">

<div className="news-header">
<h1>AI News & Sentiment</h1>
<p>AI analyzes market news and social sentiment.</p>
</div>

<div className="news-stats">

<div className="stat-card">
<span>Market Mood</span>
<h2>Bullish</h2>
</div>

<div className="stat-card">
<span>Confidence</span>
<h2>92%</h2>
</div>

<div className="stat-card">
<span>Positive News</span>
<h2>18</h2>
</div>

</div>

<div className="news-list">

{news.map((item,index)=>(

<div className="news-card" key={index}>

<h3>{item.coin}</h3>

<p>{item.title}</p>

<div className="news-bottom">

<span>{item.sentiment}</span>

<b>{item.score}</b>

</div>

</div>

))}

</div>

</div>
);
}