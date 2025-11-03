let score = 0

let panorama

// Различные места
var places = [
    [{ lat: 62.027575,  lng: 129.731505 }, {country: 'Ленин'}], // Lenin Square, Yakutsk
    [{ lat: 62.016897,  lng: 129.705356 }, {country: 'КФЕН'}], // KFEN, Yakutsk
    [{ lat: 62.157122,  lng: 117.650234 }, {country: 'Сунтар'}], // Tandem, Suntar
    [{ lat: 61.999261,  lng: 132.433982 }, {country: 'Чурапча'}], // Cafe Dragon, Churapcha
    [{ lat: 61.479675,  lng: 129.146294 },  {country: 'Покровск'}], // Chram, Pokrovsk
    [{ lat: 62.533585,   lng: 113.976676 }, {country: 'Мирный'}], // Mirniy
    [{ lat: 62.723927,  lng: 129.658311 },  {country: 'Намцы'}], // Namsi
    [{ lat: 62.160856,  lng: 129.834377 }, {country: 'Жатай'}], // Jatai
]     
  
let currentPlace = places[Math.floor(Math.random() * (places.length))]  // Рандомайзер
let coordinates = currentPlace[0] // Получение координат
let country = currentPlace[1].country // Получение названия (это мы еще поменяем на нормальную как в geoguessr)

// Перезапуск игры после окончания
let reconfigure = () => { 
  document.getElementById("score").innerHTML = "Твой текущий счет: " + score
  currentPlace = places[Math.floor(Math.random() * (places.length))]
  coordinates = currentPlace[0]
  country = currentPlace[1].country

  initialize()
}

// Проверка ответа
const guess= () => {
  var guess = window.prompt("Где это место?")
  if(guess === country) {
    score++
    alert("Правильно! Текущие очки: " + score)
    reconfigure()
  } else {
    score = 0
    alert("Неправильно! Текущие очки: " + score)
    reconfigure()
  }
}

// Настройка стритвью
function initialize() {
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("street-view"),
    {
      position: coordinates,
      pov: { heading: 165, pitch: 0 },
      zoom: 1,
    }
  )
}    


async function initializeWithToken() {
        const response = await fetch('tocenJS.txt');
        const token = (await response.text()).trim();
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${token}&callback=initialize&libraries=&v=weekly`;
        script.async = true;
        document.head.appendChild(script);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithToken);
} else {
    initializeWithToken();
}