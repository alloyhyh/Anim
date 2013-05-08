# Anim
### Anim是一个小巧、简洁、易用的动画类库，API和jQuery的调用几乎一样。
### Anim动画的API：
#### （1）show(duration, easing, callback) / hide(duration, easing, callback)
* 第一个参数：duration(动画持续的时间)，值为fast、slow、default(默认)，也支持数字参数，单位为毫秒; 
* 第二个参数：easing(字符串或函数-动画的tween算法15种); 
* 第三个参数：callback(动画执行完毕后的回调函数);
* 无参数的情况下，只改变元素的显示模式为block，有duration参数的时候，通过改变元素的width、height、opacity、padding、borderWidth来动态的显示/隐藏元素。

#### （2）slideDown(duration, easing, callback) / slideUp(duration, easing, callback)
* 通过改变元素的height、paddingTop、paddingBottom、borderTopWidth、borderBottomWidth来动态地显示/隐藏元素。

#### （3）slideToggle(duration, easing, callback)
* slideToggle会判断当前元素是否隐藏，如果是隐藏状态，将调用slideUp，如果是非隐藏状态，将调用slideDown。

#### （4）fadeIn(duration, easing, callback) / fadeOut(duration, easing, callback)
* 通过改变元素的opacity来显示和隐藏元素。

#### （5）custom(props, duration, easing, callback)
* 自定义动画的方法。除了支持常见的CSS属性以外还支持borderWidth、backgroundColor、color、borderColor的动画，注意props集合里的css属性为驼峰式命名形式。

#### （6）delay(time)
* 该方法为延时器，参数time为number类型，可以设置动画在多久后才执行。

#### （7）stop(clear, end)
* stop方法有2个参数，参数类型都为布尔值，clear为清除队列，如果没有动画队列设置该参数无效，如果有动画队列，并且clear为true，那么将清除元素中所有的动画队列。end为false时立即停止当前队列的动画，为true时将立即执行当前动画队列的最后一帧，不论是false还是true，如果该元素还有未执行完的动画队列(clear为false)，将继续执行下一个队列的动画。默认情况下clear和end都为false。
