import { ref } from 'vue'
const router = ref('home')
const setRouter = (route: string) => {
  router.value = route
}
export const useRouter = () => {
  return { router, setRouter }
}
