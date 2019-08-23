# OSSIGN超级签名系统之获取UDID

**Ossign是一个分发系统与自动签名系统整合的一套完整的代码系统**


 

主要用到的编程语言是JAVA与PHP。 JAVA系统主要作用是上传IPA文件，然后生成对应的moblieconfig文件。获取UDID生成新的profile（描述文件）进行签名。php系统主要作用是分发应用。




## 使用配置文件获取UDID


*苹果公司允许开发者通过IOS设备和Web服务器之间的某个操作，来获得IOS设备的UDID(包括其他的一些参数)。这里的一个概述：
1.在你的Web服务器上创建一个.mobileconfig的XML格式的描述文件；
2.用户在所有操作之前必须通过某个点击操作完成.mobileconfig描述文件的安装；
3.服务器需要的数据，比如：UDID，需要在.mobileconfig描述文件中配置好，以及服务器接收数据的URL地址；
4.当用户设备安装描述文件后，设备会回调你设置的URL，如果你的URL返回302跳转的话，Safari浏览器会跳转到你所给的地址；
5.mobileconifg写法*
```
 <!--参考:https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/iPhoneOTAConfiguration/ConfigurationProfileExamples/ConfigurationProfileExamples.html-->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>PayloadContent</key>
        <dict>
            <key>URL</key>
            <string>http://dev.skyfox.org/udid/receive.php</string> <!--接收数据的接口地址-->
            <key>DeviceAttributes</key>
            <array>
                <string>UDID</string>
                <string>IMEI</string>
                <string>ICCID</string>
                <string>VERSION</string>
                <string>PRODUCT</string>
            </array>
        </dict>
        <key>PayloadOrganization</key>
        <string>dev.skyfox.org</string>  <!--组织名称-->
        <key>PayloadDisplayName</key>
        <string>查询设备UDID</string>  <!--安装时显示的标题-->
        <key>PayloadVersion</key>
        <integer>1</integer>
        <key>PayloadUUID</key>
        <string>3C4DC7D2-E475-3375-489C-0BB8D737A653</string>  <!--自己随机填写的唯一字符串-->
        <key>PayloadIdentifier</key>
        <string>dev.skyfox.profile-service</string>
        <key>PayloadDescription</key>
        <string>本文件仅用来获取设备ID</string>   <!--描述-->
        <key>PayloadType</key>
        <string>Profile Service</string>
    </dict>
</plist>
```

##java代码生成mobileconfig
 
当访问mobileconfig文件不能直接下载时，可能就需要设置mime content type了，application/x-apple-aspen-config
```
  String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" +
                "<plist version=\"1.0\">\n" +
                "    <dict>\n" +
                "        <key>PayloadContent</key>\n" +
                "        <dict>\n" +
                "            <key>URL</key>\n" +
                "            <string>"+"www.baidu.com/id?id="+"</string> <!--接收数据的接口地址-->\n" +
                "            <key>DeviceAttributes</key>\n" +
                "            <array>\n" +
                "                <string>SERIAL</string>\n" +
                "                <string>MAC_ADDRESS_EN0</string>\n" +
                "                <string>UDID</string>\n" +
                "                <string>IMEI</string>\n" +
                "                <string>ICCID</string>\n" +
                "                <string>VERSION</string>\n" +
                "                <string>PRODUCT</string>\n" +
                "            </array>\n" +
                "        </dict>\n" +
                "        <key>PayloadOrganization</key>\n" +
                "        <string>" + "aa"+"</string>  <!--组织名称-->\n" +
                "        <key>PayloadDisplayName</key>\n" +
                "        <string>" + "aa"+ "</string>  <!--安装时显示的标题-->\n" +
                "        <key>PayloadVersion</key>\n" +
                "        <integer>1</integer>\n" +
                "        <key>PayloadUUID</key>\n" +
                "        <string>"+ UUID.randomUUID().toString().replace("-", "") +"</string>  <!--自己随机填写的唯一字符串-->\n" +
                "        <key>PayloadIdentifier</key>\n" +
                "        <string>online.iizvv.profile-service</string>\n" +
                "        <key>PayloadDescription</key>\n" +
                "        <string>"+Config.payloadDescription+"</string>   <!--描述-->\n" +
                "        <key>PayloadType</key>\n" +
                "        <string>Profile Service</string>\n" +
                "    </dict>\n" +
                "</plist>";
 ```
 随机填写的唯一字符串
 ```
    public static UUID randomUUID(boolean isSecure) {
        Random ng = isSecure ? UUID.Holder.numberGenerator : RandomUtil.getRandom();
        byte[] randomBytes = new byte[16];
        ((Random)ng).nextBytes(randomBytes);
        randomBytes[6] = (byte)(randomBytes[6] & 15);
        randomBytes[6] = (byte)(randomBytes[6] | 64);
        randomBytes[8] = (byte)(randomBytes[8] & 63);
        randomBytes[8] = (byte)(randomBytes[8] | 128);
        return new UUID(randomBytes);
    }
 ```

*以上步骤生成的mobileconfig需要进行openssl签名才可以上传到阿里云的oss。否则安装的时候报错。通过以下命令进行签名* 

> openssl smime -sign -in $1 -out $2 -signer ybs.crt -inkey ybsnopass.key -certfile ybs_ssl.pem -outform der -nodetach


获取到阿里云的oss路径后，直接浏览器访问。 就会进入安装环节。


##服务器接收返回数据并显示

设置好mobileconfig文件中的URL,并且下载安装mobileconfig之后,iOS设备会POST XML数据流给你的mobileconfig文件中PayloadContent节点中设置的URL。
以下是返回的格式 
 
  ```
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>IMEI</key>
        <string>12 123456 123456 7</string>
        <key>PRODUCT</key>
        <string>iPhone8,1</string>
        <key>UDID</key>
        <string>b59769e6c28b73b1195009d4b21cXXXXXXXXXXXX</string>
        <key>VERSION</key>
        <string>15B206</string>
      </dict>
    </plist>
	 ```

java代码处理返回的数据
	 ```
	    response.setContentType("text/html;charset=UTF-8");
        long begin = System.currentTimeMillis();
        String ua = request.getHeader("User-Agent");
        String itemService = null;
       
            request.setCharacterEncoding("UTF-8");
            //获取HTTP请求的输入流
            InputStream is = request.getInputStream();
            //已HTTP请求输入流建立一个BufferedReader对象
            BufferedReader br = new BufferedReader(new InputStreamReader(is,"UTF-8"));
            StringBuilder sb = new StringBuilder();
            //读取HTTP请求内容
            String buffer = null;
            while ((buffer = br.readLine()) != null) {
                sb.append(buffer);
            }
            String xml = sb.toString().substring(sb.toString().indexOf("<?xml"), sb.toString().indexOf("</plist>")+8);
  
		```