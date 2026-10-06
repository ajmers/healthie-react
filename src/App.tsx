import { useState , useEffect } from 'react'
import './App.css'

function fetchCharacters() {
  return fetch('https://rickandmortyapi.com/api/character').then(response => response.json());
}

type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
}; 


function NewItemForm(props: { characters: Character[] , items: any[] , addItem: (item: any) => void }) {
  let [formState, setState] = useState({ name: '', characterId: null, status: 'To Do' });
  return (
    <form     style={{ margin: '20px' }}>
      <input type="text" placeholder="New item" onChange={e => setState({ ...formState, name: e.target.value })}/>
      <select 
      onChange={e => setState({ ...formState, characterId: e.target.value })}>
        <option value={null} key={0}>
          Select a character
        </option>

        {props.characters.map(character => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}

      </select>
      <button onClick={(e) => 
        {
          e.preventDefault()
          props.addItem([...props.items, formState])}
        }>Add</button>
      </form>
  )}

function Card(props: { item: any, characters: Character[] }) {
  console.log("Card props:", props)
  console.log("Item:", props.item)

  return (
    <div style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
      <h4>{props.item.name}</h4>
      <img src={props.characters.find(character => character.id === props.item.characterId)?.image} alt={props.characters.find(character => character.id === props.item.characterId)?.name}/>
      <p>Status: {props.item.status}</p>
    </div>
  )
}


function App() {
  const [characters, setCharacters] = useState([]);
  const [items, setItems] = useState([]);
  useEffect(() => {
    
    fetchCharacters().then(data => {
      setCharacters(data.results);
    });
  }, [])
  console.log("Items:", items)

  return (
    <>
    <NewItemForm characters={characters} 
      items={items} 
      addItem={setItems}/>

        <div style={{ display: 'flex' , flexDirection: 'row' }}>
      <section id="left"
        style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>To Do</h3>
        {items.filter(item => item.status === 'To Do').map((item, index) => (
          <Card key={index} item={item} characters={characters} />
        ))}
      </section>

      <section id="center"
      style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>Doing</h3>
        {items.filter(item => item.status === 'Doing').map((item, index) => (
          <Card key={index} item={item} characters={characters} />

        ))}

      </section>
      <section id="right"
      style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>Done</h3></section>
        {items.filter(item => item.status === 'Done').map((item, index) => (
          <Card key={index} item={item} characters={characters} />

        ))}
      </div>
    </>
  )
}

export default App
