function initialize() {     
	var myLatlng = new google.maps.LatLng(62.040, 129.750);
	var myOptions = {
		zoom: 12,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(document.getElementsByClassName("map_canvas")[0], myOptions); 
}