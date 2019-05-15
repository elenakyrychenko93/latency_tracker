let serverURL = '//cdnetworks-paris.red5.org';
let server = document.getElementById('server');
let size = document.getElementById('size');
let quality = document.getElementById('quality');
let timer = document.getElementById("timer");
let delay = document.getElementById("delay");
let error = document.getElementById("error");
let main = document.getElementById("main");
let city = document.getElementById("publish-place");
let container = document.getElementById("container");
let errorResolution = "Your`s webCam doesn`t supports this resolution. Please, choose resolution lower.";
let vids = document.getElementsByTagName('video');
let spinner = document.getElementById("spinner");

let sizes = [
    {width: 320, height: 240, className: 'smallest'},
    {width: 640, height: 480, className: 'small'},
    {width: 1280, height: 720, className: 'medium'},
    {width: 1920, height: 1080, className: 'large'}
];
let currentSize = {width: 640, height: 480, className: 'small'};
let currentQuality = 512;
let currentVideoClass = 'small';

let options = {
    class: 'iFrameClass',
    endpoint: 'http://app.singular.live',
    interactive: true,
    syncGraphics: false,
    showPreloader: false,
    aspect: ''
};
let overlay;

window.onload = () => {
    initStream = (serverURL) => {
        hideError();
        activateSpinner();
        let streamName = 'red5proLatency' + Math.round(1 - 0.5 + Math.random() * (10000 - 1 + 1));
        ((red5prosdk) => {

            let publisher = new red5prosdk.RTCPublisher();
            let subscriber = new red5prosdk.RTCSubscriber();

            publisher.init({
                host: serverURL,
                protocol: 'wss',
                port: 443,
                iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                app: 'live',
                streamName: streamName,
                mediaElementId: 'publisher',
                bandwidth: {
                    audio: 56,
                    video: currentQuality
                },
                mediaConstraints: {
                    audio: true,
                    video: {
                        width: currentSize.width
                        ,
                        height: currentSize.height
                        ,
                        frameRate: {
                            min: 8,
                            max: 24
                        }
                    }
                }
            }).then((rtcPublisherReference) => {
                navigator.mediaDevices.getUserMedia({
                    video: {width: {min: currentSize.width}, height: {min: currentSize.height}}
                }).then((stream) => {
                    publisher.srcObject = stream;
                    rtcPublisherReference.on('*', event => {
                        console.groupCollapsed(`[rtcPublisher] ${event.type}`);
                        console.log(event);
                        console.groupEnd();
                    });
                    console.log('publish');
                    return publish();
                }).catch((error) => {
                    console.log('getUserMedia error!', error);
                    showError(errorResolution);
                });

            })
                .catch(function (error) {
                    console.error(error);
                });

            window.publish = () => {
                publisher.publish();
                publisher.on('Publish.Start', handlePublisherEvent);
            };

            window.unpublish = () => {
                publisher.unpublish().then(() => {
                    console.log('unpublished');
                });
            };

            window.unsubscribe = () => {
                subscriber.unsubscribe().then(() => {
                    console.log('Unsubscribed');
                });
            };

            window.handlePublisherEvent = () => {
                subscriber.init({
                    host: serverURL,
                    protocol: 'wss',
                    port: 443,
                    iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                    app: 'live',
                    streamName: streamName,
                    mediaElementId: 'subscriber',
                    subscriptionId: streamName
                })
                    .then((subscriber) => {
                        console.log('Subscribe');
                        return subscriber.subscribe();
                    })
                    .then((subscriber) => {
                        console.log('Subscribed');
                        removeVideoSize();
                        setVideoSize(currentVideoClass);
                        removeContainerSize();
                        setContainerSize(currentSize.className);
                        setMainBlockStyles();
                        setTimeout(deactivateSpinner(), 3000);

                        // initSingular();
                        // setSingular('0gLC3KNfPudPCd04dNl4DQ');
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            };

        })(window.red5prosdk);
    };
    initStream(serverURL);
};

window.addEventListener('beforeunload', (event) => {
    event.returnValue = clearSub();
});

async function clearSub() {
    // overlay.hide();
    await window.unsubscribe();
    await window.unpublish();
}

setMainBlockStyles = () => {
    if (currentSize.width >= 1280) {
        main.classList.remove("large");
        main.classList.add("large");
    } else {
        main.classList.remove("large");
    }
};

setContainerSize = (sizeClass) => {
    container.classList.add(sizeClass);

};

removeContainerSize = () => {
    for (let i = 0; i < sizes.length; i++) {
        if (container.classList.contains(sizes[i].className)) {
            container.classList.remove(sizes[i].className);
        }
    }
};

setVideoSize = (sizeClass) => {
    vids[0].classList.add(sizeClass);
    vids[1].classList.add(sizeClass);
};

removeVideoSize = () => {
    for (let i = 0; i < sizes.length; i++) {
        if (vids[0].classList.contains(sizes[i].className)) {
            vids[0].classList.remove(sizes[i].className);
        }
    }
};

activateSpinner = () => {
    if(!spinner.classList.contains('active')) {
        spinner.classList.add('active')
    }
};

deactivateSpinner = () => {
    spinner.classList.remove('active')
};

showError = (errorText) => {
    error.classList.add("active");
    error.innerHTML = errorText;
};

hideError = () => {
    error.innerHTML = "";
    error.classList.remove("active");
};

initSingular = () => {
    overlay = SingularOverlay('#SingularOverlay', options, (params) => {
        console.log("Singular Overlay Init - Success");
    });
};

setSingular = (compToken) => {
    overlay.setContent({
        compToken: compToken
    }, (params) => {
        // called when content finished loading
        // console.log('delay', params);
        // overlay.setDelay(5500);

        console.log("Singular Overlay Content Loaded - Success");
    });
    // overlay.setDelay(5500);
    overlay.videoSegment(4000); //looks like max delay 4000
};

chooseServer = () => {
    activateSpinner();
    clearSub().then(() => {
        let index = server.selectedIndex;
        let options = server.options;
        serverURL = options[index].value;
        initStream(serverURL);
        console.log('server URL:', serverURL);
    });
};

chooseVideoSize = () => {
    activateSpinner();
    clearSub().then(() => {
        let index = size.selectedIndex;
        let options = size.options;
        let width = options[index].value;
        currentSize = defineSize(width);
        currentVideoClass = defineSize(width).className;
        initStream(serverURL);
        console.log('current Size:', currentSize);
    });
};

defineSize = (width) => {
    activateSpinner();
    switch (width) {
        case '320':
            return sizes[0];
            break;
        case '640':
            return sizes[1];
            break;
        case '1280':
            return sizes[2];
            break;
        case '1920':
            return sizes[3];
            break;
        default:
            alert('Я таких значений не знаю');
    }
};

chooseQuality = () => {
    clearSub().then(() => {
        let index = quality.selectedIndex;
        let options = quality.options;
        currentQuality = options[index].value;
        initStream(serverURL);
        console.log('current Quality:', currentQuality);
    });
};

getCity = (data) => {
    city.innerText = data.city;
};

takeScreenshot = () => {

};