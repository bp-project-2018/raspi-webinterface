Api.setToken("Hello");
Api.getStatus()
    .then(res=>{ loadOverview() })
    .catch(err=>{ displayError })

function loadOverview() {

}

function displayError() {
    
}