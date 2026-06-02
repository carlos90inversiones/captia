Dim shell, http
Set shell = CreateObject("WScript.Shell")

' Comprobar si el servidor ya está corriendo
Dim running : running = False
On Error Resume Next
Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
http.SetTimeouts 800, 800, 800, 800
http.Open "GET", "http://localhost:3000", False
http.Send
If Err.Number = 0 Then running = True
On Error GoTo 0

' Si no está corriendo, lo arranca en segundo plano (sin ventana)
If Not running Then
    shell.Run "cmd /c ""C:\Users\carlo\Desktop\Marsof\captia\captia-start.bat""", 0, False

    ' Espera hasta que responda (máx 30 seg)
    Dim i, listo : listo = False
    For i = 1 To 30
        WScript.Sleep 1000
        On Error Resume Next
        Dim h : Set h = CreateObject("WinHttp.WinHttpRequest.5.1")
        h.SetTimeouts 800, 800, 800, 800
        h.Open "GET", "http://localhost:3000", False
        h.Send
        If Err.Number = 0 Then
            listo = True
            Exit For
        End If
        On Error GoTo 0
    Next
End If

' Abre el navegador
shell.Run "http://localhost:3000"
