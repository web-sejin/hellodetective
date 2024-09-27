import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  LogBox,
  SafeAreaView,
  ToastAndroid,
  View,
  Platform,
  Linking,
  KeyboardAvoidingView
} from 'react-native';
import { WebView } from 'react-native-webview';
import SplashScreen from 'react-native-splash-screen';
import {check, checkMultiple, PERMISSIONS, RESULTS, request, requestMultiple} from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';
import { CALL_PERMISSIONS_NOTI, usePermissions } from './hooks/usePermissions';
import messaging from '@react-native-firebase/messaging';
import VersionCheck from 'react-native-version-check';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

let cert_chk_pop = false; //승인대기중
let cert_ok_pop = false; //서약서
let success_pop = false; //가입완료, 비밀번호변경
let prv_pop = false; //약관
let filter_pop = false; //탐정매칭필터
let report_pop = false; //탐정상세신고, 탐정사례신고, 채팅신고
let chat_pop = false; //채팅의뢰
let call_pop = false; //통화의뢰
let leave_pop = false; //회원탈퇴
let modi_pop = false; //정보수정
let logout_pop = false; //로그아웃
let preview_pop = false; //이미지첨부
let big_pop = false; //이미지확대
let delete_pop = false; //고객사례 삭제
let extension_pop = false; //이용기간 연장

const widnowWidth = Dimensions.get('window').width;
const widnowHeight = Dimensions.get('window').height;

const App = () => {
  const app_domain = "https://www.customer123.kr";  
  const url = app_domain+"?appChk=1&appToken=";

  const webViews = useRef();
  const [urls, set_urls] = useState("ss");
  const [appToken, setAppToken] = useState();  
  const [is_loading, set_is_loading] = useState(true);
  const [is_loading2, set_is_loading2] = useState(true);
  const [pushState, setPushState] = useState(false);

  let canGoBack = false;
  let timeOut;  

  if(Platform.OS == 'android'){
    usePermissions(CALL_PERMISSIONS_NOTI);
  }

  useEffect(() => {
    // 앱 시작 시 한 번만 호출
    PushNotification.configure({
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }, [])

  //토큰값 구하기
  useEffect(() => {
    PushNotification.setApplicationIconBadgeNumber(0);

    async function requestUserPermission() {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
      if (enabled) {
        //console.log('Authorization status:', authStatus);
        await get_token();
      }else{
        console.log('Failed to get push token');
      }
    }

    //기기토큰 가져오기
    async function get_token() {
      await messaging()
      .getToken()
      .then(token => {
        //console.log("appToken", token);
        if(token) {
          setAppToken(token);
          return true;
        } else {
          return false;
        }
      });
    }
    requestUserPermission();
    set_is_loading(false);
    return messaging().onTokenRefresh(token => {
      setAppToken(token);
    });
  } ,[]);

  //스플래시 종료
  useEffect(() => { 
    setTimeout(function(){
      SplashScreen.hide();
    }, 1500);     
  }, []);

  //딥링크
  // useEffect(() => {
  //   const handleDeepLink = async (event) => {
  //     const url = event.url;
  //     if (url.startsWith('hellodetectiveapp://')) {
  //       // 딥링크 URL 파싱
  //       const path = url.replace('hellodetectiveapp://', '');
  //       // 웹뷰에 해당 경로 로드
  //       webViews.current.injectJavaScript(`window.location.href = '${path}';`);
  //     }
  //   };

  //   // 앱이 백그라운드에서 딥링크로 열릴 때
  //   Linking.getInitialURL().then((url) => {
  //     if (url) {
  //       handleDeepLink({ url });
  //     }
  //   });

  //   // 앱이 포그라운드에서 실행 중일 때 딥링크 처리
  //   Linking.addEventListener('url', handleDeepLink);

  //   return () => {
  //     //Linking.removeEventListener('url', handleDeepLink);
  //     Linking.remove();
  //   };
  // }, []);


  const updateChatCnt = () => {
    const chatCntData =JSON.stringify({ type: "chatCntUpdate"});
    webViews.current.postMessage(chatCntData);
  }

  //푸시메세지 처리
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      // 여기서 로컬 알림을 표시하거나 상태를 업데이트할 수 있습니다.
      updateChatCnt();
    });
  
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message received:', remoteMessage);
      // 백그라운드 메시지 처리 로직
      setTimeout(function(){
        //updateChatCnt();
        const moveNavigation =JSON.stringify({ type: "moveChat", room_idx: remoteMessage.data.room_idx });
        webViews.current.postMessage(moveNavigation);
        setPushState(true);
      }, 1500);
    });
  
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      // 필요한 경우 특정 화면으로 네비게이션      
    });
  
    // 앱이 종료된 상태에서 열렸을 때 처리
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          // 필요한 경우 특정 화면으로 네비게이션
          setTimeout(function(){
            //updateChatCnt();
            const moveNavigation =JSON.stringify({ type: "moveChat", room_idx: remoteMessage.data.room_idx });
            webViews.current.postMessage(moveNavigation);
            setPushState(true);
          }, 1500);
        }
      })
      .catch(error => console.log('Failed to get initial notification:', error));
  
    return unsubscribe;  
  }, []);

  //포스트메세지 (웹->앱)
  const onWebViewMessage = (webViews) => {
    let jsonData = JSON.parse(webViews.nativeEvent.data);
    //console.log("jsonData.data : ", jsonData);
    if(jsonData.data == "tel"){
        const number = jsonData.numb;
        Linking.openURL(`tel:${number}`);
    }else if(jsonData.data == "popup"){   
      if(jsonData.pop_id == "cert_chk_pop"){
        cert_chk_pop = jsonData.type
      }else if(jsonData.pop_id == "cert_ok_pop"){
        cert_ok_pop = jsonData.type
      }else if(jsonData.pop_id == "success_pop"){
        success_pop = jsonData.type
      }else if(jsonData.pop_id == "prv_pop"){
        prv_pop = jsonData.type
      }else if(jsonData.pop_id == "filter_pop"){
        filter_pop = jsonData.type
      }else if(jsonData.pop_id == "report_pop"){
        report_pop = jsonData.type
      }else if(jsonData.pop_id == "chat_pop"){
        chat_pop = jsonData.type
      }else if(jsonData.pop_id == "call_pop"){
        call_pop = jsonData.type
      }else if(jsonData.pop_id == "leave_pop"){
        leave_pop = jsonData.type
      }else if(jsonData.pop_id == "modi_pop"){
        modi_pop = jsonData.type
      }else if(jsonData.pop_id == "logout_pop"){
        logout_pop = jsonData.type
      }else if(jsonData.pop_id == "preview_pop"){
        preview_pop = jsonData.type
      }else if(jsonData.pop_id == "big_pop"){
        big_pop = jsonData.type
      }else if(jsonData.pop_id == "delete_pop"){
        delete_pop = jsonData.type
      }else if(jsonData.pop_id == "extension_pop"){
        extension_pop = jsonData.type
      }
    }else if(jsonData.data == "blank"){
      console.log('jsonData.url :::: ', jsonData.url);
      Linking.openURL(jsonData.url);
    }
  }

  //페이지 변화 감지
  const onNavigationStateChange = (webViewState)=>{
    //console.log("webViewState ::::::: ",webViewState.url+"////"+app_domain);
    set_urls(webViewState.url);

    cert_chk_pop = false;
    cert_ok_pop = false;
    success_pop = false;
    prv_pop = false;
    filter_pop = false;
    report_pop = false;
    chat_pop = false;
    call_pop = false;
    leave_pop = false;
    modi_pop = false;
    logout_pop = false;
    preview_pop = false;
    big_pop = false;
    delete_pop = false;
    extension_pop = false;

    //웹에 chk_app 세션 유지 위해 포스트메시지 작성
    const chkAppData =JSON.stringify({
        type: "chk_app_token",
        isapp: "1",
        istoken: appToken,
        isVersion: VersionCheck.getCurrentVersion(),
    });
    webViews.current.postMessage(chkAppData);
  }

  //뒤로가기 버튼
  useEffect(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => backHandler.remove();
  }, [urls]);

  const backAction = () => {
    const app_split = urls.split('?appChk=')[0];
    console.log("@@@@back urls : ", app_split);

    if(cert_chk_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "cert_chk_pop" });
      webViews.current.postMessage(popOffData);
    }else if(cert_ok_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "cert_ok_pop" });
      webViews.current.postMessage(popOffData);
    }else if(success_pop){    
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "success_pop" });
      webViews.current.postMessage(popOffData);
    }else if(prv_pop){      
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "prv_pop" });      
      webViews.current.postMessage(popOffData);
    }else if(filter_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "filter_pop" });
      webViews.current.postMessage(popOffData);
    }else if(report_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "report_pop" });
      webViews.current.postMessage(popOffData);
    }else if(chat_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "chat_pop" });
      webViews.current.postMessage(popOffData);
    }else if(call_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "call_pop" });
      webViews.current.postMessage(popOffData);
    }else if(leave_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "leave_pop" });
      webViews.current.postMessage(popOffData);
    }else if(modi_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "modi_pop" });
      webViews.current.postMessage(popOffData);
    }else if(logout_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "logout_pop" });
      webViews.current.postMessage(popOffData);
    }else if(preview_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "preview_pop" });
      webViews.current.postMessage(popOffData);
    }else if(big_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "big_pop" });
      webViews.current.postMessage(popOffData);
    }else if(delete_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "delete_pop" });
      webViews.current.postMessage(popOffData);
    }else if(extension_pop){
      const popOffData =JSON.stringify({ type: "popOff", pop_id: "extension_pop" });
      webViews.current.postMessage(popOffData);    
    }else{      
      if (
          app_split == app_domain + '/' ||
          app_split == app_domain ||
          urls == app_domain ||
          urls == app_domain + '/' ||
          urls.indexOf("login.php") != -1 ||
          urls.indexOf("index.php") != -1 ||        
          urls.indexOf("pro_list.php") != -1 ||
          urls.indexOf("notice.php") != -1 ||
          urls.indexOf("faq.php") != -1 ||
          urls.indexOf("mypage.php") != -1
      ){        
          if(!canGoBack){
              ToastAndroid.show('한번 더 누르면 종료합니다.', ToastAndroid.SHORT);
              canGoBack = true;

              timeOut = setTimeout(function(){
                canGoBack = false;
              }, 2000);
          }else{
              clearTimeout(timeOut);
              BackHandler.exitApp();
              canGoBack = false;
              //const sendData =JSON.stringify({ type:"종료" });

              cert_chk_pop = false;
              cert_ok_pop = false;
              success_pop = false;
              prv_pop = false;
              filter_pop = false;
              report_pop = false;
              chat_pop = false;
              call_pop = false;
              leave_pop = false;
              modi_pop = false;
              logout_pop = false;
              preview_pop = false;
              big_pop = false;
              delete_pop = false;
              extension_pop = false;
          }
      }else{                         
        if(urls.indexOf("chat_room.php") > -1 && pushState){          
          const backHome =JSON.stringify({ type: "backHome" });      
          webViews.current.postMessage(backHome);
          setPushState(false);
        }else{
          webViews.current.goBack();
        }
      }
    }

      return true;
  };  

  return (
    <SafeAreaView style={{flex:1}}>
      {is_loading ? (
        <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
          <ActivityIndicator size="large" />
        </View>          
      ) : (        
        <WebView
          ref={webViews}
          source={{ uri: url+appToken }}
          useWebKit={false}
          onMessage={webViews => onWebViewMessage(webViews)}
          onNavigationStateChange={(webViews) => onNavigationStateChange(webViews)}
          javaScriptEnabledAndroid={true}
          allowFileAccess={true}
          renderLoading={true}
          mediaPlaybackRequiresUserAction={false}
          setJavaScriptEnabled = {false}
          scalesPageToFit={true}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          textZoom={100}     
        />
      )}
    </SafeAreaView>
  );
}

export default App;
