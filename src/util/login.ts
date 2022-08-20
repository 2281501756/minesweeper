import axios from 'axios'

const login = async () => {
  let AcWingOS = window.AcWingOS
  if (!AcWingOS) {
    let user = [
      {
        name: '随便玩玩',
        photo: 'https://cdn.acwing.com/media/user/profile/photo/67937_lg_b3096b1d39.png',
      },
      {
        name: '坂田银时',
        photo:
          'https://cdn.acwing.com/media/article/image/2022/08/20/67937_14ba889220-b3fb43166d224f4adbb078da09f790529922d1ca.jpg',
      },
      {
        name: '六花',
        photo:
          'https://cdn.acwing.com/media/article/image/2022/08/20/67937_41c9333920-OIP-C-(1).jpg',
      },
      {
        name: '喜多川',
        photo:
          'https://cdn.acwing.com/media/article/image/2022/08/20/67937_32dd13b420-f0d6d37915b890e2bc8c7aed9fcd54ce8d991698.jpg@942w_531h_progressive.jpg',
      },
    ]
    let u = user[Math.floor(Math.random() * 4)]
    window.user = {
      username: u.name,
      photo: u.photo,
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
    let photo = res.data.photo.split('_')
    if (photo[1] === 'md') photo[1] = 'lg'
    res.data.photo = photo.join('_')
    window.user = res.data
  })
}
login()
