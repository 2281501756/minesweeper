import axios from 'axios'

const login = async () => {
  let AcWingOS = window.AcWingOS
  if (!AcWingOS) {
    window.user = {
      username: '随便玩玩',
      photo: 'https://cdn.acwing.com/media/user/profile/photo/67937_lg_b3096b1d39.png',
      access_token: '',
      refresh_token: '',
      openid: '',
    }
    return
  }
  let apply_code = await axios.get(
    'https://app464.acapp.acwing.com.cn:20443/mineSweeper/apply/code'
  )
  if (apply_code.data.result !== 'success') return
  let { appid, redirect_uri, scope, state } = apply_code.data.code
  AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, (res: any) => {
    console.log(res)
    window.user = res.data
  })
}
login()
